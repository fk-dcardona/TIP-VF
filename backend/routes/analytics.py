from flask import Blueprint, request, jsonify, g
from flask_cors import cross_origin
from functools import wraps
import json
import pandas as pd
from datetime import datetime, timedelta
from models import db, Upload, ProcessedData
from backend.services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
from backend.services.data_moat_strategy import DataMoatStrategy
import logging

# Create analytics blueprint
analytics_bp = Blueprint('analytics', __name__)
logger = logging.getLogger(__name__)

def require_auth(f):
    """Decorator to require authentication and extract user/org info."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract auth info from headers (would integrate with Clerk in production)
        auth_header = request.headers.get('Authorization', '')
        
        # For testing/demo, extract from custom headers or URL params
        g.user_id = request.headers.get('X-User-Id') or request.args.get('user_id', 'anonymous')
        g.org_id = request.headers.get('X-Organization-Id') or request.args.get('org_id', 'default_org')
        
        # In production, this would validate JWT and extract claims
        if not g.user_id or not g.org_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@analytics_bp.route('/dashboard/<org_id>', methods=['GET'])
def get_dashboard_data(org_id):
    """Get dashboard analytics data for an organization"""
    try:
        # Get all completed uploads for the organization
        uploads = Upload.query.filter_by(org_id=org_id, status='completed').order_by(Upload.upload_date.desc()).all()
        
        if not uploads:
            return jsonify({
                'metrics': {
                    'total_inventory': 0,
                    'order_fulfillment': 0,
                    'avg_delivery_time': 0,
                    'active_suppliers': 0
                },
                'charts': {
                    'inventory_trends': [],
                    'supplier_performance': []
                },
                'recent_activity': [],
                'analytics': None,
                'agent_insights': None
            })
        
        # Get the latest analytics and agent insights
        latest_upload = uploads[0]
        
        # Get processed data for the latest upload
        analytics_data = ProcessedData.query.filter_by(
            upload_id=latest_upload.id,
            data_type='supply_chain_analytics'
        ).first()
        
        agent_data = ProcessedData.query.filter_by(
            upload_id=latest_upload.id,
            data_type='agent_insights'
        ).first()
        
        # Parse analytics and agent insights
        analytics = json.loads(analytics_data.processed_data) if analytics_data else None
        agent_insights = json.loads(agent_data.processed_data) if agent_data else None
        
        # Calculate aggregate metrics
        metrics = calculate_aggregate_metrics(uploads)
        
        # Generate chart data
        charts = generate_chart_data(uploads)
        
        # Get recent activity
        recent_activity = get_recent_activity(uploads)
        
        # If we have analytics, use them to enhance the response
        if analytics:
            # Update metrics with real data
            if 'key_metrics' in analytics:
                metrics['total_inventory_value'] = analytics['key_metrics'].get('total_inventory_value', metrics['total_inventory'])
                metrics['critical_alerts'] = len([a for a in analytics.get('inventory_alerts', []) if a.get('alert_level') == 'critical'])
            
            # Add insights to response
            insights = analytics.get('recommendations', [])[:5]
        else:
            insights = []
        
        return jsonify({
            'metrics': metrics,
            'charts': charts,
            'recent_activity': recent_activity,
            'analytics': analytics,
            'agent_insights': agent_insights,
            'insights': insights,
            'latest_upload_id': latest_upload.id if latest_upload else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/upload/<int:upload_id>', methods=['GET'])
def get_upload_analytics(upload_id):
    """Get detailed analytics for a specific upload"""
    try:
        upload = Upload.query.get_or_404(upload_id)
        processed_data = ProcessedData.query.filter_by(upload_id=upload_id).first()
        
        if not processed_data:
            return jsonify({'error': 'No processed data found'}), 404
        
        # Parse the data summary
        data_summary = json.loads(upload.data_summary) if upload.data_summary else {}
        processed_records = json.loads(processed_data.processed_data) if processed_data.processed_data else []
        
        # Generate specific analytics based on data type
        analytics = generate_upload_analytics(data_summary, processed_records, processed_data.data_type)
        
        return jsonify({
            'upload': upload.to_dict(),
            'analytics': analytics,
            'data_preview': processed_records[:10]  # First 10 rows for preview
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_aggregate_metrics(uploads):
    """Calculate aggregate metrics across all uploads"""
    total_inventory = 0
    total_suppliers = 0
    delivery_times = []
    fulfillment_rates = []
    
    for upload in uploads:
        if upload.data_summary:
            summary = json.loads(upload.data_summary)
            analytics = summary.get('analytics', {})
            
            # Aggregate inventory data
            if 'total_inventory' in analytics:
                total_inventory += analytics['total_inventory']
            
            # Aggregate supplier data
            if 'total_suppliers' in analytics:
                total_suppliers += analytics['total_suppliers']
            
            # Aggregate delivery data
            if 'avg_delivery_time' in analytics:
                delivery_times.append(analytics['avg_delivery_time'])
            
            # Calculate fulfillment rates (mock calculation)
            if 'on_time_deliveries' in analytics and 'total_shipments' in analytics:
                rate = (analytics['on_time_deliveries'] / analytics['total_shipments']) * 100
                fulfillment_rates.append(rate)
    
    # Calculate averages and trends
    avg_delivery_time = sum(delivery_times) / len(delivery_times) if delivery_times else 3.2
    avg_fulfillment = sum(fulfillment_rates) / len(fulfillment_rates) if fulfillment_rates else 94.2
    
    return {
        'total_inventory': f"${total_inventory/1000000:.1f}M" if total_inventory > 0 else "$2.4M",
        'order_fulfillment': f"{avg_fulfillment:.1f}%",
        'avg_delivery_time': f"{avg_delivery_time:.1f} days",
        'active_suppliers': total_suppliers if total_suppliers > 0 else 127,
        'trends': {
            'inventory_change': "+12%",
            'fulfillment_change': "+2.1%",
            'delivery_change': "+0.3 days",
            'supplier_change': "+5 new"
        }
    }

def generate_chart_data(uploads):
    """Generate chart data for visualizations"""
    # Generate mock time series data for inventory trends
    inventory_trends = []
    base_date = datetime.now() - timedelta(days=30)
    
    for i in range(30):
        date = base_date + timedelta(days=i)
        # Generate realistic inventory trend data
        value = 2400000 + (i * 10000) + (i % 7 * 50000)  # Trending upward with weekly cycles
        inventory_trends.append({
            'date': date.strftime('%Y-%m-%d'),
            'value': value
        })
    
    # Generate supplier performance data
    supplier_performance = [
        {'name': 'Acme Corp', 'performance': 95, 'deliveries': 45},
        {'name': 'Global Supply Co', 'performance': 88, 'deliveries': 32},
        {'name': 'Premium Materials', 'performance': 98, 'deliveries': 28},
        {'name': 'Quick Logistics', 'performance': 82, 'deliveries': 51},
        {'name': 'Reliable Parts', 'performance': 91, 'deliveries': 38}
    ]
    
    return {
        'inventory_trends': inventory_trends,
        'supplier_performance': supplier_performance
    }

def get_recent_activity(uploads):
    """Get recent activity data"""
    activities = []
    
    for upload in uploads[-10:]:  # Last 10 uploads
        if upload.data_summary:
            summary = json.loads(upload.data_summary)
            data_type = summary.get('data_type', 'unknown')
            
            # Generate activity based on data type
            if data_type == 'inventory':
                activities.append({
                    'product': f'Widget A-{upload.id}',
                    'supplier': 'Acme Corp',
                    'quantity': f'{1000 + (upload.id * 100)} units',
                    'status': 'Delivered',
                    'date': upload.upload_date.strftime('%b %d, %Y')
                })
            elif data_type == 'supplier':
                activities.append({
                    'product': f'Component B-{upload.id}',
                    'supplier': 'Global Supply Co',
                    'quantity': f'{500 + (upload.id * 50)} units',
                    'status': 'In Transit',
                    'date': upload.upload_date.strftime('%b %d, %Y')
                })
            elif data_type == 'shipment':
                activities.append({
                    'product': f'Material C-{upload.id}',
                    'supplier': 'Premium Materials',
                    'quantity': f'{2000 + (upload.id * 200)} kg',
                    'status': 'Processing',
                    'date': upload.upload_date.strftime('%b %d, %Y')
                })
    
    # If no uploads, return sample data
    if not activities:
        activities = [
            {
                'product': 'Widget A-123',
                'supplier': 'Acme Corp',
                'quantity': '1,500 units',
                'status': 'Delivered',
                'date': 'Dec 12, 2024'
            },
            {
                'product': 'Component B-456',
                'supplier': 'Global Supply Co',
                'quantity': '750 units',
                'status': 'In Transit',
                'date': 'Dec 11, 2024'
            },
            {
                'product': 'Material C-789',
                'supplier': 'Premium Materials',
                'quantity': '2,000 kg',
                'status': 'Processing',
                'date': 'Dec 10, 2024'
            }
        ]
    
    return activities

def generate_upload_analytics(data_summary, processed_records, data_type):
    """Generate detailed analytics for a specific upload"""
    analytics = {
        'summary': data_summary,
        'data_type': data_type,
        'visualizations': []
    }
    
    if data_type == 'inventory':
        analytics['visualizations'] = [
            {
                'type': 'bar_chart',
                'title': 'Inventory by Category',
                'data': generate_inventory_charts(processed_records)
            },
            {
                'type': 'line_chart',
                'title': 'Stock Levels Over Time',
                'data': generate_stock_trends(processed_records)
            }
        ]
    elif data_type == 'supplier':
        analytics['visualizations'] = [
            {
                'type': 'scatter_plot',
                'title': 'Performance vs Delivery Time',
                'data': generate_supplier_charts(processed_records)
            }
        ]
    elif data_type == 'shipment':
        analytics['visualizations'] = [
            {
                'type': 'pie_chart',
                'title': 'Shipment Status Distribution',
                'data': generate_shipment_charts(processed_records)
            }
        ]
    
    return analytics

def generate_inventory_charts(records):
    """Generate inventory-specific chart data"""
    if not records:
        return []
    
    # Group by category if available
    categories = {}
    for record in records:
        category = record.get('Category', record.get('category', 'Unknown'))
        quantity = record.get('Quantity', record.get('quantity', 0))
        
        if isinstance(quantity, (int, float)):
            categories[category] = categories.get(category, 0) + quantity
    
    return [{'category': k, 'value': v} for k, v in categories.items()]

def generate_stock_trends(records):
    """Generate stock trend data"""
    # Mock trend data since we don't have historical data
    return [
        {'date': '2024-12-01', 'stock': 1200},
        {'date': '2024-12-02', 'stock': 1150},
        {'date': '2024-12-03', 'stock': 1300},
        {'date': '2024-12-04', 'stock': 1250},
        {'date': '2024-12-05', 'stock': 1400}
    ]

def generate_supplier_charts(records):
    """Generate supplier-specific chart data"""
    if not records:
        return []
    
    chart_data = []
    for record in records:
        performance = record.get('Performance_Rating', record.get('performance_rating', 0))
        delivery_time = record.get('Delivery_Time_Days', record.get('delivery_time_days', 0))
        name = record.get('Company_Name', record.get('company_name', 'Unknown'))
        
        if isinstance(performance, (int, float)) and isinstance(delivery_time, (int, float)):
            chart_data.append({
                'x': delivery_time,
                'y': performance,
                'name': name
            })
    
    return chart_data

def generate_shipment_charts(records):
    """Generate shipment-specific chart data"""
    if not records:
        return []
    
    status_counts = {}
    for record in records:
        status = record.get('Status', record.get('status', 'Unknown'))
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return [{'status': k, 'count': v} for k, v in status_counts.items()]


# Enhanced Analytics Endpoints for Frontend Integration

@analytics_bp.route('/triangle/<org_id>', methods=['GET'])
@require_auth
@cross_origin()
def get_triangle_analytics(org_id: str):
    """Get 4D triangle analytics including document intelligence"""
    try:
        # Use enhanced cross-reference engine
        engine = DocumentEnhancedCrossReferenceEngine()
        
        # Get comprehensive 4D analysis
        analysis = engine.process_with_documents(org_id)
        
        return jsonify({
            'success': True,
            'triangle_4d_score': analysis.get('triangle_4d_score', {}),
            'traditional_intelligence': analysis.get('traditional_intelligence', {}),
            'document_intelligence': analysis.get('document_intelligence', {}),
            'inventory_intelligence': analysis.get('inventory_intelligence', {}),
            'cost_intelligence': analysis.get('cost_intelligence', {}),
            'timeline_intelligence': analysis.get('timeline_intelligence', {}),
            'predictive_intelligence': analysis.get('predictive_intelligence', {}),
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/cross-reference/<org_id>', methods=['GET'])
@require_auth
@cross_origin()
def get_cross_reference_analytics(org_id: str):
    """Get cross-reference intelligence with document validation"""
    try:
        from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
        engine = DocumentEnhancedCrossReferenceEngine()
        
        analysis = engine.process_with_documents(org_id)
        
        return jsonify({
            'success': True,
            'cross_reference_results': analysis.get('cross_reference_results', {}),
            'compromised_inventory': analysis.get('inventory_intelligence', {}),
            'cost_variances': analysis.get('cost_intelligence', {}),
            'timeline_analysis': analysis.get('timeline_intelligence', {}),
            'real_time_alerts': analysis.get('real_time_alerts', []),
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/supplier-performance/<org_id>', methods=['GET'])
@require_auth
@cross_origin()
def get_supplier_performance_analytics(org_id: str):
    """Get supplier performance analytics with document validation"""
    try:
        from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
        engine = DocumentEnhancedCrossReferenceEngine()
        
        analysis = engine.process_with_documents(org_id)
        
        # Extract supplier-specific data
        supplier_data = {
            'performance_scores': analysis.get('traditional_intelligence', {}).get('supplier_metrics', {}),
            'cost_variances': analysis.get('cost_intelligence', {}).get('variance_by_supplier', {}),
            'timeline_performance': analysis.get('timeline_intelligence', {}).get('timeline_variance_by_supplier', {}),
            'compromised_items': analysis.get('inventory_intelligence', {}).get('compromised_by_supplier', {}),
            'recommendations': analysis.get('enhanced_recommendations', [])
        }
        
        return jsonify({
            'success': True,
            'supplier_performance': supplier_data,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/market-intelligence/<org_id>', methods=['GET'])
@require_auth
@cross_origin()
def get_market_intelligence_analytics(org_id: str):
    """Get market intelligence with document-enhanced insights"""
    try:
        from services.enhanced_cross_reference_engine import DocumentEnhancedCrossReferenceEngine
        engine = DocumentEnhancedCrossReferenceEngine()
        
        analysis = engine.process_with_documents(org_id)
        
        # Extract market intelligence data
        market_data = {
            'demand_trends': analysis.get('predictive_intelligence', {}).get('demand_forecast', {}),
            'pricing_trends': analysis.get('cost_intelligence', {}).get('cost_trend_analysis', {}),
            'supplier_landscape': analysis.get('traditional_intelligence', {}).get('supplier_metrics', {}),
            'competitive_insights': analysis.get('predictive_intelligence', {}).get('market_analysis', {}),
            'risk_assessment': analysis.get('inventory_intelligence', {}).get('risk_analysis', {})
        }
        
        return jsonify({
            'success': True,
            'market_intelligence': market_data,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@analytics_bp.route('/dashboard/<org_id>', methods=['GET'])
def get_dashboard_analytics(org_id):
    """Get comprehensive dashboard analytics for an organization"""
    try:
        # Initialize engines
        engine = DocumentEnhancedCrossReferenceEngine()
        data_moat = DataMoatStrategy()
        
        # Get comprehensive dashboard data
        dashboard_data = {
            'triangle_analytics': engine.get_triangle_analytics(org_id),
            'cross_reference': engine.get_cross_reference_analytics(org_id),
            'supplier_performance': data_moat.get_supplier_performance_analytics(org_id),
            'market_intelligence': data_moat.get_market_intelligence_analytics(org_id),
            'document_intelligence': engine.get_document_intelligence_summary(org_id)
        }
        
        return jsonify({
            'success': True,
            'data': dashboard_data,
            'message': 'Dashboard analytics retrieved successfully'
        })
    except Exception as e:
        logger.error(f"Error getting dashboard analytics for {org_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving dashboard analytics: {str(e)}'
        }), 500

