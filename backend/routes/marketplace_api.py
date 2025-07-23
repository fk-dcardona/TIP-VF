"""
Marketplace API for Finkargo Data Monetization
Provides access to aggregated market intelligence with tiered pricing
"""

from flask import Blueprint, request, jsonify, g
from flask_cors import cross_origin
from functools import wraps
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import uuid

from models import db
from models_enhanced import (
    MarketplaceIntelligence, MarketIntelligence, CustomerIntelligence,
    DataQualityMetrics, APIIntegration
)
from backend.services.data_moat_strategy import DataMoatStrategyService
import logging

logger = logging.getLogger(__name__)

# Create blueprint
marketplace_api = Blueprint('marketplace_api', __name__)

# Subscription tiers and pricing
SUBSCRIPTION_TIERS = {
    'free': {
        'name': 'Free',
        'price': 0,
        'limits': {
            'api_calls_per_month': 100,
            'market_intelligence_access': 'basic',
            'data_export_limit': 100,
            'support_level': 'community'
        },
        'features': [
            'Basic market overview',
            'Limited supplier insights',
            'Community support'
        ]
    },
    'basic': {
        'name': 'Basic',
        'price': 299,
        'limits': {
            'api_calls_per_month': 1000,
            'market_intelligence_access': 'standard',
            'data_export_limit': 1000,
            'support_level': 'email'
        },
        'features': [
            'Standard market intelligence',
            'Supplier performance scores',
            'Basic forecasting',
            'Email support'
        ]
    },
    'premium': {
        'name': 'Premium',
        'price': 999,
        'limits': {
            'api_calls_per_month': 10000,
            'market_intelligence_access': 'advanced',
            'data_export_limit': 10000,
            'support_level': 'priority'
        },
        'features': [
            'Advanced market intelligence',
            'Predictive analytics',
            'Custom reports',
            'Priority support',
            'API access'
        ]
    },
    'enterprise': {
        'name': 'Enterprise',
        'price': 2999,
        'limits': {
            'api_calls_per_month': 100000,
            'market_intelligence_access': 'full',
            'data_export_limit': 100000,
            'support_level': 'dedicated'
        },
        'features': [
            'Full market intelligence',
            'Custom integrations',
            'Dedicated support',
            'White-label options',
            'Advanced API access'
        ]
    }
}


def require_auth(f):
    """Decorator to require authentication and extract user/org info."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Extract auth info from headers (would integrate with Clerk in production)
        auth_header = request.headers.get('Authorization', '')
        
        # For testing/demo, extract from custom headers
        g.user_id = request.headers.get('X-User-Id', 'anonymous')
        g.org_id = request.headers.get('X-Organization-Id', 'default_org')
        
        # In production, this would validate JWT and extract claims
        if not g.user_id or not g.org_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


def check_subscription_tier(required_tier: str):
    """Decorator to check subscription tier access."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user's subscription tier
            user_tier = get_user_subscription_tier(g.org_id)
            
            # Check if user has required access
            tier_hierarchy = ['free', 'basic', 'premium', 'enterprise']
            user_tier_index = tier_hierarchy.index(user_tier)
            required_tier_index = tier_hierarchy.index(required_tier)
            
            if user_tier_index < required_tier_index:
                return jsonify({
                    'error': f'Subscription tier {required_tier} required',
                    'current_tier': user_tier,
                    'upgrade_url': f'/pricing?upgrade={required_tier}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def get_user_subscription_tier(org_id: str) -> str:
    """Get user's subscription tier (simplified for demo)"""
    # In production, this would query the database
    # For demo, return based on org_id pattern
    if org_id.startswith('enterprise_'):
        return 'enterprise'
    elif org_id.startswith('premium_'):
        return 'premium'
    elif org_id.startswith('basic_'):
        return 'basic'
    else:
        return 'free'


@marketplace_api.route('/marketplace/intelligence', methods=['GET'])
@require_auth
@check_subscription_tier('basic')
@cross_origin()
def get_market_intelligence():
    """Get market intelligence based on subscription tier"""
    try:
        # Get query parameters
        product_category = request.args.get('product_category')
        geographic_region = request.args.get('geographic_region')
        time_period = request.args.get('time_period', 'current')
        intelligence_type = request.args.get('type', 'market_overview')
        
        # Get user's subscription tier
        user_tier = get_user_subscription_tier(g.org_id)
        
        # Query marketplace intelligence
        query = MarketplaceIntelligence.query
        
        if product_category:
            query = query.filter_by(product_category=product_category)
        if geographic_region:
            query = query.filter_by(geographic_region=geographic_region)
        if intelligence_type:
            query = query.filter_by(intelligence_type=intelligence_type)
        
        # Apply tier-based filtering
        if user_tier == 'free':
            # Free tier: only basic market overview
            query = query.filter_by(intelligence_type='market_overview')
            limit = 5
        elif user_tier == 'basic':
            # Basic tier: standard intelligence
            limit = 20
        elif user_tier == 'premium':
            # Premium tier: advanced intelligence
            limit = 100
        else:  # enterprise
            # Enterprise tier: full access
            limit = 1000
        
        intelligence_data = query.limit(limit).all()
        
        # Format response based on tier
        response_data = []
        for intel in intelligence_data:
            data = {
                'id': intel.id,
                'product_category': intel.product_category,
                'geographic_region': intel.geographic_region,
                'time_period': intel.time_period.isoformat() if intel.time_period else None,
                'intelligence_type': intel.intelligence_type,
                'total_transaction_volume': intel.total_transaction_volume,
                'transaction_count': intel.transaction_count,
                'average_order_size': intel.average_order_size,
                'confidence_score': intel.confidence_score,
                'data_points_count': intel.data_points_count
            }
            
            # Add tier-specific data
            if user_tier in ['premium', 'enterprise']:
                data.update({
                    'top_quartile_metrics': intel.top_quartile_metrics,
                    'median_metrics': intel.median_metrics,
                    'bottom_quartile_metrics': intel.bottom_quartile_metrics,
                    'supplier_performance_scores': intel.supplier_performance_scores,
                    'demand_trends': intel.demand_trends,
                    'pricing_trends': intel.pricing_trends
                })
            
            if user_tier == 'enterprise':
                data.update({
                    'demand_forecast': intel.demand_forecast,
                    'price_forecast': intel.price_forecast,
                    'risk_forecast': intel.risk_forecast,
                    'market_concentration': intel.market_concentration,
                    'competitive_intensity': intel.competitive_intensity
                })
            
            response_data.append(data)
        
        return jsonify({
            'success': True,
            'intelligence': response_data,
            'total_count': len(response_data),
            'subscription_tier': user_tier,
            'access_level': SUBSCRIPTION_TIERS[user_tier]['limits']['market_intelligence_access']
        })
        
    except Exception as e:
        logger.error(f"Error getting market intelligence: {str(e)}")
        return jsonify({'error': 'Failed to get market intelligence', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/supplier-insights', methods=['GET'])
@require_auth
@check_subscription_tier('premium')
@cross_origin()
def get_supplier_insights():
    """Get supplier performance insights (Premium+ only)"""
    try:
        # Get query parameters
        supplier_country = request.args.get('supplier_country')
        product_category = request.args.get('product_category')
        
        # Query supplier intelligence
        query = MarketplaceIntelligence.query.filter_by(intelligence_type='supplier_performance')
        
        if supplier_country:
            query = query.filter_by(geographic_region=supplier_country)
        if product_category:
            query = query.filter_by(product_category=product_category)
        
        supplier_data = query.limit(50).all()
        
        # Format supplier insights
        insights = []
        for data in supplier_data:
            if data.supplier_performance_scores:
                insights.append({
                    'geographic_region': data.geographic_region,
                    'product_category': data.product_category,
                    'supplier_reliability_index': data.supplier_reliability_index,
                    'supplier_diversity_score': data.supplier_diversity_score,
                    'performance_scores': data.supplier_performance_scores,
                    'confidence_score': data.confidence_score
                })
        
        return jsonify({
            'success': True,
            'supplier_insights': insights,
            'total_count': len(insights)
        })
        
    except Exception as e:
        logger.error(f"Error getting supplier insights: {str(e)}")
        return jsonify({'error': 'Failed to get supplier insights', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/forecasts', methods=['GET'])
@require_auth
@check_subscription_tier('enterprise')
@cross_origin()
def get_market_forecasts():
    """Get market forecasts (Enterprise only)"""
    try:
        # Get query parameters
        product_category = request.args.get('product_category')
        geographic_region = request.args.get('geographic_region')
        forecast_type = request.args.get('type', 'demand')  # demand, price, risk
        
        # Query forecast data
        query = MarketplaceIntelligence.query.filter_by(intelligence_type=f'{forecast_type}_forecast')
        
        if product_category:
            query = query.filter_by(product_category=product_category)
        if geographic_region:
            query = query.filter_by(geographic_region=geographic_region)
        
        forecast_data = query.limit(20).all()
        
        # Format forecast data
        forecasts = []
        for data in forecast_data:
            forecast_info = {
                'product_category': data.product_category,
                'geographic_region': data.geographic_region,
                'forecast_type': forecast_type,
                'confidence_score': data.confidence_score,
                'data_points_count': data.data_points_count
            }
            
            # Add specific forecast data
            if forecast_type == 'demand' and data.demand_forecast:
                forecast_info['forecast_data'] = data.demand_forecast
            elif forecast_type == 'price' and data.price_forecast:
                forecast_info['forecast_data'] = data.price_forecast
            elif forecast_type == 'risk' and data.risk_forecast:
                forecast_info['forecast_data'] = data.risk_forecast
            
            forecasts.append(forecast_info)
        
        return jsonify({
            'success': True,
            'forecasts': forecasts,
            'total_count': len(forecasts)
        })
        
    except Exception as e:
        logger.error(f"Error getting market forecasts: {str(e)}")
        return jsonify({'error': 'Failed to get market forecasts', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/subscription', methods=['GET'])
@require_auth
@cross_origin()
def get_subscription_info():
    """Get user's subscription information"""
    try:
        user_tier = get_user_subscription_tier(g.org_id)
        tier_info = SUBSCRIPTION_TIERS[user_tier]
        
        # Get usage statistics
        usage_stats = get_usage_statistics(g.org_id, user_tier)
        
        return jsonify({
            'success': True,
            'subscription': {
                'tier': user_tier,
                'name': tier_info['name'],
                'price': tier_info['price'],
                'limits': tier_info['limits'],
                'features': tier_info['features']
            },
            'usage': usage_stats,
            'upgrade_options': get_upgrade_options(user_tier)
        })
        
    except Exception as e:
        logger.error(f"Error getting subscription info: {str(e)}")
        return jsonify({'error': 'Failed to get subscription info', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/upgrade', methods=['POST'])
@require_auth
@cross_origin()
def upgrade_subscription():
    """Upgrade subscription tier"""
    try:
        data = request.get_json()
        new_tier = data.get('tier')
        
        if not new_tier or new_tier not in SUBSCRIPTION_TIERS:
            return jsonify({'error': 'Invalid subscription tier'}), 400
        
        current_tier = get_user_subscription_tier(g.org_id)
        tier_hierarchy = ['free', 'basic', 'premium', 'enterprise']
        
        current_index = tier_hierarchy.index(current_tier)
        new_index = tier_hierarchy.index(new_tier)
        
        if new_index <= current_index:
            return jsonify({'error': 'Can only upgrade to higher tier'}), 400
        
        # In production, this would integrate with payment processor
        # For demo, just return success
        return jsonify({
            'success': True,
            'message': f'Successfully upgraded to {new_tier} tier',
            'new_tier': new_tier,
            'price': SUBSCRIPTION_TIERS[new_tier]['price']
        })
        
    except Exception as e:
        logger.error(f"Error upgrading subscription: {str(e)}")
        return jsonify({'error': 'Failed to upgrade subscription', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/data-quality', methods=['GET'])
@require_auth
@cross_origin()
def get_data_quality_metrics():
    """Get data quality metrics for the organization"""
    try:
        # Get data quality metrics
        quality_metrics = DataQualityMetrics.query.filter_by(org_id=g.org_id).first()
        
        if not quality_metrics:
            return jsonify({
                'success': True,
                'data_quality': {
                    'overall_score': 0,
                    'quality_tier': 'bronze',
                    'data_points_contributed': 0,
                    'credits_earned': 0
                }
            })
        
        return jsonify({
            'success': True,
            'data_quality': {
                'overall_score': quality_metrics.overall_quality_score,
                'quality_tier': quality_metrics.quality_tier,
                'completeness_score': quality_metrics.completeness_score,
                'accuracy_score': quality_metrics.accuracy_score,
                'consistency_score': quality_metrics.consistency_score,
                'timeliness_score': quality_metrics.timeliness_score,
                'uniqueness_score': quality_metrics.uniqueness_score,
                'data_points_contributed': quality_metrics.data_points_contributed,
                'unique_insights_contributed': quality_metrics.unique_insights_contributed,
                'marketplace_value_score': quality_metrics.marketplace_value_score,
                'credits_earned': quality_metrics.credits_earned,
                'discount_percentage': quality_metrics.discount_percentage
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting data quality metrics: {str(e)}")
        return jsonify({'error': 'Failed to get data quality metrics', 'details': str(e)}), 500


@marketplace_api.route('/marketplace/analytics', methods=['GET'])
@require_auth
@check_subscription_tier('premium')
@cross_origin()
def get_marketplace_analytics():
    """Get marketplace analytics (Premium+ only)"""
    try:
        # Execute data moat strategy to get analytics
        data_moat_service = DataMoatStrategyService()
        analytics = data_moat_service.execute_data_moat_strategy(g.org_id)
        
        # Filter based on subscription tier
        user_tier = get_user_subscription_tier(g.org_id)
        
        response_data = {
            'competitive_advantage': analytics.get('competitive_advantage', {}),
            'network_effects': analytics.get('network_effects', {})
        }
        
        # Add premium features
        if user_tier in ['premium', 'enterprise']:
            response_data['monetization_potential'] = analytics.get('monetization_potential', {})
        
        # Add enterprise features
        if user_tier == 'enterprise':
            response_data['customer_intelligence'] = analytics.get('customer_intelligence', {})
            response_data['market_intelligence'] = analytics.get('market_intelligence', {})
            response_data['document_intelligence'] = analytics.get('document_intelligence', {})
        
        return jsonify({
            'success': True,
            'analytics': response_data,
            'subscription_tier': user_tier
        })
        
    except Exception as e:
        logger.error(f"Error getting marketplace analytics: {str(e)}")
        return jsonify({'error': 'Failed to get marketplace analytics', 'details': str(e)}), 500


def get_usage_statistics(org_id: str, tier: str) -> Dict:
    """Get usage statistics for the organization"""
    # In production, this would query actual usage data
    # For demo, return mock data
    return {
        'api_calls_this_month': 45,
        'api_calls_limit': SUBSCRIPTION_TIERS[tier]['limits']['api_calls_per_month'],
        'data_exports_this_month': 12,
        'data_exports_limit': SUBSCRIPTION_TIERS[tier]['limits']['data_export_limit'],
        'usage_percentage': {
            'api_calls': 45,
            'data_exports': 12
        }
    }


def get_upgrade_options(current_tier: str) -> List[Dict]:
    """Get upgrade options for current tier"""
    tier_hierarchy = ['free', 'basic', 'premium', 'enterprise']
    current_index = tier_hierarchy.index(current_tier)
    
    upgrade_options = []
    for tier in tier_hierarchy[current_index + 1:]:
        tier_info = SUBSCRIPTION_TIERS[tier]
        upgrade_options.append({
            'tier': tier,
            'name': tier_info['name'],
            'price': tier_info['price'],
            'features': tier_info['features'],
            'upgrade_url': f'/marketplace/upgrade?tier={tier}'
        })
    
    return upgrade_options 