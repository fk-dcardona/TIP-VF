"""
Database migration for Finkargo Data Moat Strategy
Adds enhanced intelligence models to create competitive advantage
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

def upgrade():
    """Add data moat tables for market intelligence"""
    
    # Create TradeFinanceTransaction table
    op.create_table('trade_finance_transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(100), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('transaction_type', sa.String(50)),
        sa.Column('amount_usd', sa.Float, nullable=False),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('transaction_date', sa.Date, nullable=False),
        sa.Column('completion_date', sa.Date),
        sa.Column('importer_org_id', sa.String(100)),
        sa.Column('supplier_name', sa.String(255)),
        sa.Column('supplier_country', sa.String(100)),
        sa.Column('supplier_region', sa.String(100)),
        sa.Column('product_category', sa.String(100)),
        sa.Column('product_subcategory', sa.String(100)),
        sa.Column('hs_code', sa.String(20)),
        sa.Column('quantity', sa.Float),
        sa.Column('unit_of_measure', sa.String(20)),
        sa.Column('payment_terms_days', sa.Integer),
        sa.Column('advance_payment_percentage', sa.Float),
        sa.Column('credit_insurance_coverage', sa.Float),
        sa.Column('financing_rate', sa.Float),
        sa.Column('country_risk_score', sa.Float),
        sa.Column('supplier_risk_score', sa.Float),
        sa.Column('transaction_risk_score', sa.Float),
        sa.Column('currency_risk_score', sa.Float),
        sa.Column('market_demand_score', sa.Float),
        sa.Column('competitive_pricing_score', sa.Float),
        sa.Column('supplier_market_share', sa.Float),
        sa.Column('working_capital_impact', sa.Float),
        sa.Column('cash_conversion_days', sa.Integer),
        sa.Column('financing_cost', sa.Float),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create CustomerIntelligence table
    op.create_table('customer_intelligence',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(100), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('customer_type', sa.String(50)),
        sa.Column('industry_sector', sa.String(100)),
        sa.Column('company_size', sa.String(50)),
        sa.Column('geographic_market', sa.String(100)),
        sa.Column('years_in_business', sa.Integer),
        sa.Column('annual_revenue_range', sa.String(50)),
        sa.Column('credit_rating', sa.String(10)),
        sa.Column('payment_history_score', sa.Float),
        sa.Column('financial_health_score', sa.Float),
        sa.Column('preferred_suppliers', sa.JSON),
        sa.Column('typical_order_size', sa.Float),
        sa.Column('order_frequency_days', sa.Integer),
        sa.Column('seasonal_patterns', sa.JSON),
        sa.Column('product_preferences', sa.JSON),
        sa.Column('platform_engagement_score', sa.Float),
        sa.Column('feature_usage_pattern', sa.JSON),
        sa.Column('data_quality_contribution', sa.Float),
        sa.Column('satisfaction_score', sa.Float),
        sa.Column('net_promoter_score', sa.Integer),
        sa.Column('pain_points', sa.JSON),
        sa.Column('feature_requests', sa.JSON),
        sa.Column('competitors_used', sa.JSON),
        sa.Column('market_share_estimate', sa.Float),
        sa.Column('growth_rate', sa.Float),
        sa.Column('churn_risk_score', sa.Float),
        sa.Column('upsell_potential_score', sa.Float),
        sa.Column('lifetime_value_estimate', sa.Float),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create MarketIntelligence table
    op.create_table('market_intelligence',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('product_category', sa.String(100), nullable=False),
        sa.Column('product_subcategory', sa.String(100)),
        sa.Column('geographic_region', sa.String(100), nullable=False),
        sa.Column('country', sa.String(100)),
        sa.Column('time_period', sa.Date, nullable=False),
        sa.Column('total_market_demand', sa.Float),
        sa.Column('demand_growth_rate', sa.Float),
        sa.Column('seasonal_index', sa.Float),
        sa.Column('demand_volatility', sa.Float),
        sa.Column('total_suppliers', sa.Integer),
        sa.Column('new_suppliers_count', sa.Integer),
        sa.Column('supplier_concentration', sa.Float),
        sa.Column('average_lead_time', sa.Integer),
        sa.Column('lead_time_variance', sa.Float),
        sa.Column('average_unit_price', sa.Float),
        sa.Column('price_volatility', sa.Float),
        sa.Column('price_trend', sa.String(20)),
        sa.Column('price_elasticity', sa.Float),
        sa.Column('average_quality_score', sa.Float),
        sa.Column('defect_rate', sa.Float),
        sa.Column('return_rate', sa.Float),
        sa.Column('top_importers', sa.JSON),
        sa.Column('market_share_distribution', sa.JSON),
        sa.Column('new_entrants', sa.Integer),
        sa.Column('supply_chain_risk_score', sa.Float),
        sa.Column('currency_risk_score', sa.Float),
        sa.Column('political_risk_score', sa.Float),
        sa.Column('logistics_risk_score', sa.Float),
        sa.Column('data_points_count', sa.Integer),
        sa.Column('confidence_score', sa.Float),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Add unique constraint for MarketIntelligence
    op.create_unique_constraint(
        'uq_market_intelligence_scope',
        'market_intelligence',
        ['product_category', 'geographic_region', 'time_period', 'country']
    )
    
    # Create MarketplaceIntelligence table
    op.create_table('marketplace_intelligence',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('intelligence_type', sa.String(50)),
        sa.Column('product_category', sa.String(100), nullable=False),
        sa.Column('geographic_region', sa.String(100), nullable=False),
        sa.Column('time_period', sa.Date, nullable=False),
        sa.Column('total_transaction_volume', sa.Float),
        sa.Column('transaction_count', sa.Integer),
        sa.Column('average_order_size', sa.Float),
        sa.Column('top_quartile_metrics', sa.JSON),
        sa.Column('median_metrics', sa.JSON),
        sa.Column('bottom_quartile_metrics', sa.JSON),
        sa.Column('supplier_performance_scores', sa.JSON),
        sa.Column('supplier_reliability_index', sa.Float),
        sa.Column('supplier_diversity_score', sa.Float),
        sa.Column('demand_trends', sa.JSON),
        sa.Column('pricing_trends', sa.JSON),
        sa.Column('supply_chain_trends', sa.JSON),
        sa.Column('demand_forecast', sa.JSON),
        sa.Column('price_forecast', sa.JSON),
        sa.Column('risk_forecast', sa.JSON),
        sa.Column('market_concentration', sa.Float),
        sa.Column('competitive_intensity', sa.Float),
        sa.Column('market_maturity_score', sa.Float),
        sa.Column('confidence_score', sa.Float),
        sa.Column('data_points_count', sa.Integer),
        sa.Column('last_updated', sa.DateTime, default=sa.func.now()),
        sa.Column('tier_required', sa.String(20)),
        sa.Column('created_at', sa.DateTime, default=sa.func.now())
    )
    
    # Add unique constraint for MarketplaceIntelligence
    op.create_unique_constraint(
        'uq_marketplace_intelligence_scope',
        'marketplace_intelligence',
        ['intelligence_type', 'product_category', 'geographic_region', 'time_period']
    )
    
    # Create FeedbackCollection table
    op.create_table('feedback_collection',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(100), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('feedback_type', sa.String(50)),
        sa.Column('feedback_text', sa.Text),
        sa.Column('feedback_source', sa.String(50)),
        sa.Column('sentiment_score', sa.Float),
        sa.Column('emotion_tags', sa.JSON),
        sa.Column('urgency_score', sa.Float),
        sa.Column('key_topics', sa.JSON),
        sa.Column('entities_mentioned', sa.JSON),
        sa.Column('action_items', sa.JSON),
        sa.Column('pain_points', sa.JSON),
        sa.Column('competitor_mentions', sa.JSON),
        sa.Column('feature_requests', sa.JSON),
        sa.Column('pricing_feedback', sa.JSON),
        sa.Column('status', sa.String(50)),
        sa.Column('priority', sa.String(20)),
        sa.Column('assigned_to', sa.String(100)),
        sa.Column('resolution', sa.Text),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create APIIntegration table
    op.create_table('api_integrations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(100), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('integration_type', sa.String(50)),
        sa.Column('provider_name', sa.String(100)),
        sa.Column('api_endpoint', sa.String(255)),
        sa.Column('api_version', sa.String(20)),
        sa.Column('auth_type', sa.String(50)),
        sa.Column('credentials_encrypted', sa.Text),
        sa.Column('sync_frequency', sa.String(20)),
        sa.Column('last_sync', sa.DateTime),
        sa.Column('next_sync', sa.DateTime),
        sa.Column('data_volume', sa.Integer),
        sa.Column('field_mappings', sa.JSON),
        sa.Column('data_transformations', sa.JSON),
        sa.Column('data_quality_score', sa.Float),
        sa.Column('intelligence_types', sa.JSON),
        sa.Column('business_value_score', sa.Float),
        sa.Column('status', sa.String(50)),
        sa.Column('error_message', sa.Text),
        sa.Column('error_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create CompetitorIntelligence table
    op.create_table('competitor_intelligence',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('competitor_name', sa.String(255), nullable=False),
        sa.Column('competitor_type', sa.String(50)),
        sa.Column('market_focus', sa.String(100)),
        sa.Column('estimated_market_share', sa.Float),
        sa.Column('customer_count_estimate', sa.Integer),
        sa.Column('revenue_estimate', sa.String(50)),
        sa.Column('growth_rate_estimate', sa.Float),
        sa.Column('key_features', sa.JSON),
        sa.Column('pricing_model', sa.JSON),
        sa.Column('target_customers', sa.JSON),
        sa.Column('unique_selling_points', sa.JSON),
        sa.Column('strengths', sa.JSON),
        sa.Column('weaknesses', sa.JSON),
        sa.Column('opportunities', sa.JSON),
        sa.Column('threats', sa.JSON),
        sa.Column('customer_satisfaction', sa.Float),
        sa.Column('common_complaints', sa.JSON),
        sa.Column('switching_triggers', sa.JSON),
        sa.Column('data_sources', sa.JSON),
        sa.Column('confidence_level', sa.Float),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create DataQualityMetrics table
    op.create_table('data_quality_metrics',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(100), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('completeness_score', sa.Float),
        sa.Column('accuracy_score', sa.Float),
        sa.Column('consistency_score', sa.Float),
        sa.Column('timeliness_score', sa.Float),
        sa.Column('uniqueness_score', sa.Float),
        sa.Column('overall_quality_score', sa.Float),
        sa.Column('quality_tier', sa.String(20)),
        sa.Column('data_points_contributed', sa.Integer),
        sa.Column('unique_insights_contributed', sa.Integer),
        sa.Column('marketplace_value_score', sa.Float),
        sa.Column('credits_earned', sa.Integer),
        sa.Column('discount_percentage', sa.Float),
        sa.Column('premium_features_unlocked', sa.JSON),
        sa.Column('period_start', sa.Date),
        sa.Column('period_end', sa.Date),
        sa.Column('created_at', sa.DateTime, default=sa.func.now())
    )
    
    # Create indexes for performance
    op.create_index('idx_trade_finance_org_date', 'trade_finance_transactions', ['org_id', 'transaction_date'])
    op.create_index('idx_trade_finance_supplier', 'trade_finance_transactions', ['supplier_name', 'supplier_country'])
    op.create_index('idx_customer_intel_org', 'customer_intelligence', ['org_id'])
    op.create_index('idx_market_intel_category_region', 'market_intelligence', ['product_category', 'geographic_region'])
    op.create_index('idx_marketplace_intel_type_category', 'marketplace_intelligence', ['intelligence_type', 'product_category'])
    op.create_index('idx_feedback_org_type', 'feedback_collection', ['org_id', 'feedback_type'])
    op.create_index('idx_api_integration_org_status', 'api_integrations', ['org_id', 'status'])


def downgrade():
    """Remove data moat tables"""
    op.drop_table('data_quality_metrics')
    op.drop_table('competitor_intelligence')
    op.drop_table('api_integrations')
    op.drop_table('feedback_collection')
    op.drop_table('marketplace_intelligence')
    op.drop_table('market_intelligence')
    op.drop_table('customer_intelligence')
    op.drop_table('trade_finance_transactions')