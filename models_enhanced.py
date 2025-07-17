"""
Enhanced Data Models for Finkargo Data Moat Strategy
These models extend the base models.py to create comprehensive market intelligence
"""

from models import db
from datetime import datetime
import uuid
import json

# Phase 1: Enhanced Data Capture Models

class TradeFinanceTransaction(db.Model):
    """Captures detailed trade finance transactions for intelligence extraction"""
    __tablename__ = 'trade_finance_transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    
    # Transaction Details
    transaction_type = db.Column(db.String(50))  # LC, factoring, credit_insurance, trade_loan
    amount_usd = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    transaction_date = db.Column(db.Date, nullable=False)
    completion_date = db.Column(db.Date)
    
    # Parties
    importer_org_id = db.Column(db.String(100))  # Your customer
    supplier_name = db.Column(db.String(255))
    supplier_country = db.Column(db.String(100))
    supplier_region = db.Column(db.String(100))  # Latin America, Asia, Europe, etc.
    
    # Product Intelligence
    product_category = db.Column(db.String(100))
    product_subcategory = db.Column(db.String(100))
    hs_code = db.Column(db.String(20))  # Harmonized System code
    quantity = db.Column(db.Float)
    unit_of_measure = db.Column(db.String(20))
    
    # Payment Terms
    payment_terms_days = db.Column(db.Integer)
    advance_payment_percentage = db.Column(db.Float)
    credit_insurance_coverage = db.Column(db.Float)
    financing_rate = db.Column(db.Float)
    
    # Risk Metrics
    country_risk_score = db.Column(db.Float)
    supplier_risk_score = db.Column(db.Float)
    transaction_risk_score = db.Column(db.Float)
    currency_risk_score = db.Column(db.Float)
    
    # Market Intelligence
    market_demand_score = db.Column(db.Float)  # Based on other importers
    competitive_pricing_score = db.Column(db.Float)
    supplier_market_share = db.Column(db.Float)
    
    # Financial Impact
    working_capital_impact = db.Column(db.Float)
    cash_conversion_days = db.Column(db.Integer)
    financing_cost = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('trade_finance_transactions', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'transaction_type': self.transaction_type,
            'amount_usd': self.amount_usd,
            'currency': self.currency,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'supplier_name': self.supplier_name,
            'supplier_country': self.supplier_country,
            'product_category': self.product_category,
            'hs_code': self.hs_code,
            'payment_terms_days': self.payment_terms_days,
            'transaction_risk_score': self.transaction_risk_score,
            'market_demand_score': self.market_demand_score
        }


class CustomerIntelligence(db.Model):
    """Deep customer profiling for understanding needs and predicting behavior"""
    __tablename__ = 'customer_intelligence'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    
    # Customer Profile
    customer_type = db.Column(db.String(50))  # importer, distributor, retailer, manufacturer
    industry_sector = db.Column(db.String(100))
    company_size = db.Column(db.String(50))  # small, medium, large, enterprise
    geographic_market = db.Column(db.String(100))
    years_in_business = db.Column(db.Integer)
    
    # Business Intelligence
    annual_revenue_range = db.Column(db.String(50))  # <1M, 1-10M, 10-50M, 50-100M, >100M
    credit_rating = db.Column(db.String(10))
    payment_history_score = db.Column(db.Float)
    financial_health_score = db.Column(db.Float)
    
    # Supply Chain Intelligence
    preferred_suppliers = db.Column(db.JSON)  # List of supplier names and countries
    typical_order_size = db.Column(db.Float)
    order_frequency_days = db.Column(db.Integer)
    seasonal_patterns = db.Column(db.JSON)  # Monthly demand patterns
    product_preferences = db.Column(db.JSON)  # Categories and subcategories
    
    # Behavioral Intelligence
    platform_engagement_score = db.Column(db.Float)  # How actively they use the platform
    feature_usage_pattern = db.Column(db.JSON)  # Which features they use most
    data_quality_contribution = db.Column(db.Float)  # How good their data is
    
    # Feedback & Satisfaction
    satisfaction_score = db.Column(db.Float)
    net_promoter_score = db.Column(db.Integer)
    pain_points = db.Column(db.JSON)
    feature_requests = db.Column(db.JSON)
    
    # Market Intelligence
    competitors_used = db.Column(db.JSON)  # Other platforms/solutions they use
    market_share_estimate = db.Column(db.Float)
    growth_rate = db.Column(db.Float)
    
    # Predictive Scores
    churn_risk_score = db.Column(db.Float)
    upsell_potential_score = db.Column(db.Float)
    lifetime_value_estimate = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('customer_intelligence', lazy=True))


class MarketIntelligence(db.Model):
    """Aggregated market data for specific product categories and regions"""
    __tablename__ = 'market_intelligence'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Market Scope
    product_category = db.Column(db.String(100), nullable=False)
    product_subcategory = db.Column(db.String(100))
    geographic_region = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100))
    time_period = db.Column(db.Date, nullable=False)
    
    # Demand Intelligence
    total_market_demand = db.Column(db.Float)  # In units or USD
    demand_growth_rate = db.Column(db.Float)  # Month-over-month %
    seasonal_index = db.Column(db.Float)  # 1.0 = average, >1 = high season
    demand_volatility = db.Column(db.Float)  # Standard deviation
    
    # Supply Intelligence
    total_suppliers = db.Column(db.Integer)
    new_suppliers_count = db.Column(db.Integer)  # New this period
    supplier_concentration = db.Column(db.Float)  # Herfindahl index
    average_lead_time = db.Column(db.Integer)  # Days
    lead_time_variance = db.Column(db.Float)
    
    # Pricing Intelligence
    average_unit_price = db.Column(db.Float)
    price_volatility = db.Column(db.Float)
    price_trend = db.Column(db.String(20))  # increasing, decreasing, stable
    price_elasticity = db.Column(db.Float)  # Demand sensitivity to price
    
    # Quality Metrics
    average_quality_score = db.Column(db.Float)
    defect_rate = db.Column(db.Float)
    return_rate = db.Column(db.Float)
    
    # Competitive Intelligence
    top_importers = db.Column(db.JSON)  # List of anonymized importer profiles
    market_share_distribution = db.Column(db.JSON)  # Distribution of market share
    new_entrants = db.Column(db.Integer)  # New importers this period
    
    # Risk Intelligence
    supply_chain_risk_score = db.Column(db.Float)
    currency_risk_score = db.Column(db.Float)
    political_risk_score = db.Column(db.Float)
    logistics_risk_score = db.Column(db.Float)
    
    # Data Quality
    data_points_count = db.Column(db.Integer)  # Number of transactions analyzed
    confidence_score = db.Column(db.Float)  # Statistical confidence
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('product_category', 'geographic_region', 'time_period', 'country'),
    )


class MarketplaceIntelligence(db.Model):
    """Anonymized and aggregated data for the marketplace"""
    __tablename__ = 'marketplace_intelligence'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Market Scope
    intelligence_type = db.Column(db.String(50))  # demand, supply, pricing, risk
    product_category = db.Column(db.String(100), nullable=False)
    geographic_region = db.Column(db.String(100), nullable=False)
    time_period = db.Column(db.Date, nullable=False)
    
    # Aggregated Intelligence
    total_transaction_volume = db.Column(db.Float)
    transaction_count = db.Column(db.Integer)
    average_order_size = db.Column(db.Float)
    
    # Performance Benchmarks
    top_quartile_metrics = db.Column(db.JSON)  # Best performers
    median_metrics = db.Column(db.JSON)  # Average performers
    bottom_quartile_metrics = db.Column(db.JSON)  # Poor performers
    
    # Supplier Intelligence (Anonymized)
    supplier_performance_scores = db.Column(db.JSON)  # Aggregated scores by country/region
    supplier_reliability_index = db.Column(db.Float)
    supplier_diversity_score = db.Column(db.Float)
    
    # Market Trends
    demand_trends = db.Column(db.JSON)  # Historical and projected
    pricing_trends = db.Column(db.JSON)
    supply_chain_trends = db.Column(db.JSON)
    
    # Predictive Intelligence
    demand_forecast = db.Column(db.JSON)  # Next 3, 6, 12 months
    price_forecast = db.Column(db.JSON)
    risk_forecast = db.Column(db.JSON)
    
    # Competitive Landscape
    market_concentration = db.Column(db.Float)
    competitive_intensity = db.Column(db.Float)
    market_maturity_score = db.Column(db.Float)
    
    # Data Quality
    confidence_score = db.Column(db.Float)
    data_points_count = db.Column(db.Integer)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Monetization
    tier_required = db.Column(db.String(20))  # free, basic, premium, enterprise
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('intelligence_type', 'product_category', 'geographic_region', 'time_period'),
    )


# Phase 2: Enhanced Collection Models

class FeedbackCollection(db.Model):
    """Systematic collection of customer feedback for intelligence extraction"""
    __tablename__ = 'feedback_collection'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    user_id = db.Column(db.String(100), nullable=False)
    
    # Feedback Types
    feedback_type = db.Column(db.String(50))  # feature_request, bug_report, satisfaction, competitor_info, market_insight
    feedback_text = db.Column(db.Text)
    feedback_source = db.Column(db.String(50))  # in_app, email, support_ticket, sales_call
    
    # Sentiment Analysis
    sentiment_score = db.Column(db.Float)  # -1 to 1
    emotion_tags = db.Column(db.JSON)  # frustrated, satisfied, excited, etc.
    urgency_score = db.Column(db.Float)
    
    # Intelligence Extraction
    key_topics = db.Column(db.JSON)  # Extracted topics using NLP
    entities_mentioned = db.Column(db.JSON)  # Companies, products, features
    action_items = db.Column(db.JSON)  # Identified actions
    
    # Business Intelligence
    pain_points = db.Column(db.JSON)
    competitor_mentions = db.Column(db.JSON)  # Competitors and what's mentioned
    feature_requests = db.Column(db.JSON)
    pricing_feedback = db.Column(db.JSON)
    
    # Follow-up
    status = db.Column(db.String(50))  # new, in_review, actioned, closed
    priority = db.Column(db.String(20))  # low, medium, high, critical
    assigned_to = db.Column(db.String(100))
    resolution = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('feedback_collection', lazy=True))


class APIIntegration(db.Model):
    """Track and manage API integrations for continuous data collection"""
    __tablename__ = 'api_integrations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    
    # Integration Details
    integration_type = db.Column(db.String(50))  # erp, accounting, ecommerce, customs, logistics
    provider_name = db.Column(db.String(100))  # SAP, QuickBooks, Shopify, etc.
    api_endpoint = db.Column(db.String(255))
    api_version = db.Column(db.String(20))
    
    # Authentication
    auth_type = db.Column(db.String(50))  # oauth2, api_key, basic
    credentials_encrypted = db.Column(db.Text)  # Encrypted credentials
    
    # Data Flow
    sync_frequency = db.Column(db.String(20))  # real_time, hourly, daily, weekly
    last_sync = db.Column(db.DateTime)
    next_sync = db.Column(db.DateTime)
    data_volume = db.Column(db.Integer)  # Records per sync
    
    # Data Mapping
    field_mappings = db.Column(db.JSON)  # How external fields map to our models
    data_transformations = db.Column(db.JSON)  # Any transformations applied
    
    # Intelligence Value
    data_quality_score = db.Column(db.Float)
    intelligence_types = db.Column(db.JSON)  # What intelligence we extract
    business_value_score = db.Column(db.Float)
    
    # Status
    status = db.Column(db.String(50))  # active, paused, error, pending
    error_message = db.Column(db.Text)
    error_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('api_integrations', lazy=True))


class CompetitorIntelligence(db.Model):
    """Track competitor activities and market positioning"""
    __tablename__ = 'competitor_intelligence'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Competitor Profile
    competitor_name = db.Column(db.String(255), nullable=False)
    competitor_type = db.Column(db.String(50))  # direct, indirect, potential
    market_focus = db.Column(db.String(100))  # Latin America, Global, etc.
    
    # Market Position
    estimated_market_share = db.Column(db.Float)
    customer_count_estimate = db.Column(db.Integer)
    revenue_estimate = db.Column(db.String(50))  # Range
    growth_rate_estimate = db.Column(db.Float)
    
    # Product Intelligence
    key_features = db.Column(db.JSON)
    pricing_model = db.Column(db.JSON)
    target_customers = db.Column(db.JSON)
    unique_selling_points = db.Column(db.JSON)
    
    # Competitive Analysis
    strengths = db.Column(db.JSON)
    weaknesses = db.Column(db.JSON)
    opportunities = db.Column(db.JSON)
    threats = db.Column(db.JSON)
    
    # Customer Feedback
    customer_satisfaction = db.Column(db.Float)
    common_complaints = db.Column(db.JSON)
    switching_triggers = db.Column(db.JSON)  # Why customers leave them
    
    # Intelligence Sources
    data_sources = db.Column(db.JSON)  # Where we got this info
    confidence_level = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DataQualityMetrics(db.Model):
    """Track data quality to ensure marketplace value"""
    __tablename__ = 'data_quality_metrics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    
    # Quality Dimensions
    completeness_score = db.Column(db.Float)  # % of required fields filled
    accuracy_score = db.Column(db.Float)  # % of accurate data points
    consistency_score = db.Column(db.Float)  # % following standards
    timeliness_score = db.Column(db.Float)  # % updated on time
    uniqueness_score = db.Column(db.Float)  # % without duplicates
    
    # Overall Score
    overall_quality_score = db.Column(db.Float)
    quality_tier = db.Column(db.String(20))  # gold, silver, bronze
    
    # Contribution Metrics
    data_points_contributed = db.Column(db.Integer)
    unique_insights_contributed = db.Column(db.Integer)
    marketplace_value_score = db.Column(db.Float)
    
    # Incentive Tracking
    credits_earned = db.Column(db.Integer)
    discount_percentage = db.Column(db.Float)
    premium_features_unlocked = db.Column(db.JSON)
    
    period_start = db.Column(db.Date)
    period_end = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('data_quality_metrics', lazy=True))