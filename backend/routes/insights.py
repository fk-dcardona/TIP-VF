from flask import Blueprint, request, jsonify
from insights_engine import SupplyChainInsightsEngine
from supply_chain_engine import SupplyChainAnalyticsEngine
from models import db, Upload, ProcessedData
import json

insights_bp = Blueprint('insights', __name__)
insights_engine = SupplyChainInsightsEngine()
analytics_engine = SupplyChainAnalyticsEngine()

@insights_bp.route('/api/insights/<user_id>', methods=['GET'])
def get_user_insights(user_id):
    """Get comprehensive insights for a user based on their uploaded data"""
    try:
        # Get user's latest upload
        latest_upload = Upload.query.filter_by(user_id=user_id).order_by(Upload.upload_date.desc()).first()
        
        if not latest_upload:
            return jsonify({
                'success': False,
                'message': 'No data uploaded yet. Please upload your inventory and sales data first.'
            }), 404
        
        # Get processed data
        processed_data = ProcessedData.query.filter_by(upload_id=latest_upload.id).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'message': 'Data is still being processed. Please try again in a moment.'
            }), 202
        
        # Parse analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        # Generate comprehensive insights
        insights = insights_engine.generate_comprehensive_insights(analytics_data)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'data_quality_score': analytics_data.get('data_quality_score', 0),
            'last_updated': latest_upload.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating insights: {str(e)}'
        }), 500

@insights_bp.route('/api/insights/<user_id>/role/<role>', methods=['GET'])
def get_role_specific_insights(user_id, role):
    """Get insights specific to a business role"""
    try:
        # Validate role
        valid_roles = ['general_manager', 'sales', 'procurement', 'finance', 'logistics']
        if role not in valid_roles:
            return jsonify({
                'success': False,
                'message': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }), 400
        
        # Get user's latest upload
        latest_upload = Upload.query.filter_by(user_id=user_id).order_by(Upload.upload_date.desc()).first()
        
        if not latest_upload:
            return jsonify({
                'success': False,
                'message': 'No data uploaded yet.'
            }), 404
        
        # Get processed data
        processed_data = ProcessedData.query.filter_by(upload_id=latest_upload.id).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'message': 'Data is still being processed.'
            }), 202
        
        # Parse analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        # Generate role-specific insights
        role_insights = getattr(insights_engine, f'_generate_{role}_insights')(analytics_data)
        role_recommendations = insights_engine.generate_role_specific_recommendations(role, analytics_data)
        
        return jsonify({
            'success': True,
            'role': role,
            'insights': role_insights,
            'recommendations': role_recommendations,
            'last_updated': latest_upload.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating role-specific insights: {str(e)}'
        }), 500

@insights_bp.route('/api/insights/<user_id>/actions', methods=['GET'])
def get_action_items(user_id):
    """Get prioritized action items for the user"""
    try:
        # Get user's latest upload
        latest_upload = Upload.query.filter_by(user_id=user_id).order_by(Upload.upload_date.desc()).first()
        
        if not latest_upload:
            return jsonify({
                'success': False,
                'message': 'No data uploaded yet.'
            }), 404
        
        # Get processed data
        processed_data = ProcessedData.query.filter_by(upload_id=latest_upload.id).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'message': 'Data is still being processed.'
            }), 202
        
        # Parse analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        # Generate action items
        action_items = insights_engine._generate_action_items(analytics_data)
        
        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        action_items.sort(key=lambda x: priority_order.get(x.get('priority', 'low'), 3))
        
        return jsonify({
            'success': True,
            'action_items': action_items,
            'total_items': len(action_items),
            'critical_items': len([item for item in action_items if item.get('priority') == 'critical']),
            'last_updated': latest_upload.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating action items: {str(e)}'
        }), 500

@insights_bp.route('/api/insights/<user_id>/summary', methods=['GET'])
def get_insights_summary(user_id):
    """Get a quick summary of key insights for dashboard"""
    try:
        # Get user's latest upload
        latest_upload = Upload.query.filter_by(user_id=user_id).order_by(Upload.upload_date.desc()).first()
        
        if not latest_upload:
            return jsonify({
                'success': False,
                'message': 'No data uploaded yet.'
            }), 404
        
        # Get processed data
        processed_data = ProcessedData.query.filter_by(upload_id=latest_upload.id).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'message': 'Data is still being processed.'
            }), 202
        
        # Parse analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        # Generate comprehensive insights
        all_insights = insights_engine.generate_comprehensive_insights(analytics_data)
        
        # Create summary
        summary = {
            'health_score': analytics_data.get('summary', {}).get('overall_health_score', 0),
            'critical_alerts': len([
                alert for insights in all_insights.values() 
                if isinstance(insights, list)
                for alert in insights 
                if isinstance(alert, dict) and alert.get('priority') == 'critical'
            ]),
            'high_priority_items': len([
                alert for insights in all_insights.values() 
                if isinstance(insights, list)
                for alert in insights 
                if isinstance(alert, dict) and alert.get('priority') == 'high'
            ]),
            'top_opportunities': [
                insight for insight in all_insights.get('executive_insights', [])
                if insight.get('type') == 'strategic_opportunity'
            ][:3],
            'urgent_actions': [
                insight for insight in all_insights.get('procurement_insights', [])
                if insight.get('priority') == 'critical'
            ][:3],
            'cash_optimization': [
                insight for insight in all_insights.get('finance_insights', [])
                if 'cash' in insight.get('title', '').lower()
            ][:2]
        }
        
        return jsonify({
            'success': True,
            'summary': summary,
            'last_updated': latest_upload.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating insights summary: {str(e)}'
        }), 500

@insights_bp.route('/api/insights/<user_id>/share', methods=['POST'])
def share_insights(user_id):
    """Generate shareable insights for team collaboration"""
    try:
        data = request.get_json()
        role = data.get('role', 'general_manager')
        insights_to_share = data.get('insights', [])
        
        # Get user's latest upload
        latest_upload = Upload.query.filter_by(user_id=user_id).order_by(Upload.upload_date.desc()).first()
        
        if not latest_upload:
            return jsonify({
                'success': False,
                'message': 'No data uploaded yet.'
            }), 404
        
        # Get processed data
        processed_data = ProcessedData.query.filter_by(upload_id=latest_upload.id).first()
        
        if not processed_data:
            return jsonify({
                'success': False,
                'message': 'Data is still being processed.'
            }), 202
        
        # Parse analytics data
        analytics_data = json.loads(processed_data.processed_data)
        
        # Generate shareable report
        share_data = {
            'shared_by': role,
            'company_health_score': analytics_data.get('summary', {}).get('overall_health_score', 0),
            'key_metrics': {
                'total_products': analytics_data.get('key_metrics', {}).get('total_products', 0),
                'total_inventory_value': analytics_data.get('financial_insights', {}).get('total_inventory_value', 0),
                'working_capital_efficiency': analytics_data.get('financial_insights', {}).get('working_capital_efficiency', 0)
            },
            'shared_insights': insights_to_share,
            'generated_at': latest_upload.created_at.isoformat(),
            'share_url': f"/shared-insights/{user_id}/{latest_upload.id}"
        }
        
        return jsonify({
            'success': True,
            'share_data': share_data,
            'message': 'Insights prepared for sharing'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error preparing insights for sharing: {str(e)}'
        }), 500

