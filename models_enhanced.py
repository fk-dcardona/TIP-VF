"""
Enhanced Data Models for Finkargo Data Moat Strategy
These models extend the base models.py to create comprehensive market intelligence
"""

from models import db
from datetime import datetime
import uuid
import json
from typing import List, Dict
import numpy as np

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

    def _analyze_demand_trends(self, market_data: List[MarketIntelligence]) -> Dict:
        """Analyze demand trends across markets"""
        if not market_data:
            return {}
        
        # Calculate overall demand growth
        total_demand = sum(m.total_market_demand for m in market_data if m.total_market_demand)
        avg_growth = np.mean([m.demand_growth_rate for m in market_data if m.demand_growth_rate])
        
        return {
            'total_demand': total_demand,
            'average_growth_rate': avg_growth,
            'growth_trend': 'increasing' if avg_growth > 0 else 'decreasing'
        }
    
    def _analyze_price_trends(self, market_data: List[MarketIntelligence]) -> Dict:
        """Analyze price trends across markets"""
        if not market_data:
            return {}
        
        avg_price = np.mean([m.average_unit_price for m in market_data if m.average_unit_price])
        avg_volatility = np.mean([m.price_volatility for m in market_data if m.price_volatility])
        
        return {
            'average_price': avg_price,
            'price_volatility': avg_volatility,
            'price_stability': 'stable' if avg_volatility < 0.1 else 'volatile'
        }
    
    def _analyze_supply_trends(self, market_data: List[MarketIntelligence]) -> Dict:
        """Analyze supply trends across markets"""
        if not market_data:
            return {}
        
        total_suppliers = sum(m.total_suppliers for m in market_data if m.total_suppliers)
        avg_lead_time = np.mean([m.average_lead_time for m in market_data if m.average_lead_time])
        
        return {
            'total_suppliers': total_suppliers,
            'average_lead_time': avg_lead_time,
            'supply_efficiency': 'efficient' if avg_lead_time < 30 else 'slow'
        }
    
    def _analyze_risk_trends(self, market_data: List[MarketIntelligence]) -> Dict:
        """Analyze risk trends across markets"""
        if not market_data:
            return {}
        
        avg_risk = np.mean([m.supply_chain_risk_score for m in market_data if m.supply_chain_risk_score])
        
        return {
            'average_risk_score': avg_risk,
            'risk_level': 'low' if avg_risk < 0.3 else 'medium' if avg_risk < 0.7 else 'high'
        }
    
    def _calculate_market_concentration(self, market_data: List[MarketIntelligence]) -> float:
        """Calculate market concentration using Herfindahl index"""
        if not market_data:
            return 0.0
        
        # Calculate concentration based on supplier distribution
        total_suppliers = sum(m.total_suppliers for m in market_data if m.total_suppliers)
        if total_suppliers == 0:
            return 0.0
        
        # Simplified Herfindahl calculation
        market_shares = [m.total_suppliers / total_suppliers for m in market_data if m.total_suppliers]
        herfindahl = sum(share ** 2 for share in market_shares)
        
        return herfindahl
    
    def _calculate_competitive_intensity(self, market_data: List[MarketIntelligence]) -> float:
        """Calculate competitive intensity score"""
        if not market_data:
            return 0.0
        
        # Factors: number of suppliers, new entrants, market maturity
        avg_suppliers = np.mean([m.total_suppliers for m in market_data if m.total_suppliers])
        total_new_entrants = sum(m.new_entrants for m in market_data if m.new_entrants)
        
        # Normalize to 0-1 scale
        supplier_intensity = min(avg_suppliers / 100, 1.0)  # Cap at 100 suppliers
        new_entrant_intensity = min(total_new_entrants / 50, 1.0)  # Cap at 50 new entrants
        
        return (supplier_intensity + new_entrant_intensity) / 2
    
    def _identify_market_opportunities(self, market_data: List[MarketIntelligence]) -> List[Dict]:
        """Identify market opportunities based on intelligence"""
        opportunities = []
        
        for market in market_data:
            # High growth, low competition opportunity
            if (market.demand_growth_rate and market.demand_growth_rate > 0.15 and
                market.total_suppliers and market.total_suppliers < 20):
                opportunities.append({
                    'market': f"{market.product_category} - {market.geographic_region}",
                    'type': 'high_growth_low_competition',
                    'growth_rate': market.demand_growth_rate,
                    'supplier_count': market.total_suppliers,
                    'opportunity_score': market.demand_growth_rate * (1 / market.total_suppliers)
                })
            
            # Supply chain optimization opportunity
            if (market.average_lead_time and market.average_lead_time > 45 and
                market.supply_chain_risk_score and market.supply_chain_risk_score > 0.6):
                opportunities.append({
                    'market': f"{market.product_category} - {market.geographic_region}",
                    'type': 'supply_chain_optimization',
                    'current_lead_time': market.average_lead_time,
                    'risk_score': market.supply_chain_risk_score,
                    'opportunity_score': market.average_lead_time * market.supply_chain_risk_score
                })
        
        # Sort by opportunity score
        opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
        return opportunities[:5]  # Top 5 opportunities
    
    def _calculate_market_intelligence_score(self, market_data: List[MarketIntelligence]) -> float:
        """Calculate market intelligence score"""
        if not market_data:
            return 0.0
        
        # Score based on data completeness and quality
        scores = []
        for market in market_data:
            score = 0.0
            
            # Data completeness
            if market.total_market_demand:
                score += 20
            if market.demand_growth_rate is not None:
                score += 15
            if market.average_unit_price:
                score += 15
            if market.total_suppliers:
                score += 15
            if market.average_lead_time:
                score += 15
            if market.supply_chain_risk_score is not None:
                score += 20
            
            # Quality bonus
            if market.confidence_score:
                score *= market.confidence_score
            
            scores.append(score)
        
        return np.mean(scores) if scores else 0.0
    
    def _calculate_compliance_score(self, document_results: List[Dict]) -> float:
        """Calculate compliance score from document processing"""
        if not document_results:
            return 0.0
        
        compliance_scores = []
        for doc in document_results:
            if 'compliance_status' in doc:
                status = doc['compliance_status']
                if status == 'compliant':
                    compliance_scores.append(1.0)
                elif status == 'at_risk':
                    compliance_scores.append(0.5)
                else:
                    compliance_scores.append(0.0)
        
        return np.mean(compliance_scores) * 100 if compliance_scores else 0.0
    
    def _calculate_cost_accuracy(self, document_results: List[Dict]) -> float:
        """Calculate cost accuracy from document processing"""
        if not document_results:
            return 0.0
        
        accuracy_scores = []
        for doc in document_results:
            if 'cost_variance_percentage' in doc:
                variance = abs(doc['cost_variance_percentage'])
                # Lower variance = higher accuracy
                accuracy = max(0, 100 - variance)
                accuracy_scores.append(accuracy)
        
        return np.mean(accuracy_scores) if accuracy_scores else 0.0
    
    def _calculate_timeline_efficiency(self, document_results: List[Dict]) -> float:
        """Calculate timeline efficiency from document processing"""
        if not document_results:
            return 0.0
        
        efficiency_scores = []
        for doc in document_results:
            if 'timeline_variance' in doc:
                variance = doc['timeline_variance']
                # Lower variance = higher efficiency
                efficiency = max(0, 100 - abs(variance))
                efficiency_scores.append(efficiency)
        
        return np.mean(efficiency_scores) if efficiency_scores else 0.0
    
    def _calculate_risk_detection(self, document_results: List[Dict]) -> float:
        """Calculate risk detection effectiveness"""
        if not document_results:
            return 0.0
        
        risk_detected = 0
        total_docs = len(document_results)
        
        for doc in document_results:
            if doc.get('anomaly_flags') or doc.get('risk_score', 0) > 0.5:
                risk_detected += 1
        
        return (risk_detected / total_docs) * 100 if total_docs > 0 else 0.0
    
    def _calculate_processing_efficiency(self, document_results: List[Dict]) -> float:
        """Calculate document processing efficiency"""
        if not document_results:
            return 0.0
        
        # Calculate average processing time and accuracy
        processing_times = []
        confidence_scores = []
        
        for doc in document_results:
            if 'processing_time' in doc:
                processing_times.append(doc['processing_time'])
            if 'confidence' in doc:
                confidence_scores.append(doc['confidence'])
        
        avg_time = np.mean(processing_times) if processing_times else 0
        avg_confidence = np.mean(confidence_scores) if confidence_scores else 0
        
        # Efficiency = confidence / time (normalized)
        efficiency = (avg_confidence * 100) / max(avg_time, 1)
        return min(efficiency, 100.0)
    
    def _identify_document_opportunities(self, document_results: List[Dict]) -> List[Dict]:
        """Identify opportunities from document processing"""
        opportunities = []
        
        # Cost variance opportunities
        high_variance_docs = [
            doc for doc in document_results 
            if doc.get('cost_variance_percentage', 0) > 10
        ]
        
        if high_variance_docs:
            avg_variance = np.mean([doc['cost_variance_percentage'] for doc in high_variance_docs])
            opportunities.append({
                'type': 'cost_optimization',
                'description': f'Reduce cost variance (avg: {avg_variance:.1f}%)',
                'documents_affected': len(high_variance_docs),
                'potential_savings': avg_variance * 0.5  # Assume 50% improvement potential
            })
        
        # Compliance opportunities
        non_compliant_docs = [
            doc for doc in document_results 
            if doc.get('compliance_status') == 'violated'
        ]
        
        if non_compliant_docs:
            opportunities.append({
                'type': 'compliance_improvement',
                'description': 'Address compliance violations',
                'documents_affected': len(non_compliant_docs),
                'risk_reduction': len(non_compliant_docs) * 0.1  # 10% risk reduction per doc
            })
        
        return opportunities
    
    def _calculate_document_intelligence_score(self, doc_intelligence: Dict) -> float:
        """Calculate document intelligence score"""
        scores = []
        
        if 'compliance_score' in doc_intelligence:
            scores.append(doc_intelligence['compliance_score'])
        if 'cost_accuracy' in doc_intelligence:
            scores.append(doc_intelligence['cost_accuracy'])
        if 'timeline_efficiency' in doc_intelligence:
            scores.append(doc_intelligence['timeline_efficiency'])
        if 'risk_detection' in doc_intelligence:
            scores.append(doc_intelligence['risk_detection'])
        
        return np.mean(scores) if scores else 0.0


# Phase 2: Unified Document Intelligence Models

class UnifiedTransaction(db.Model):
    """Enhanced unified transaction model with document intelligence and cross-referencing capabilities"""
    __tablename__ = 'unified_transactions'
    
    # Core identification
    transaction_id = db.Column(db.String(50), primary_key=True)
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    transaction_type = db.Column(db.String(20))  # SALE, PURCHASE, INVENTORY, DOCUMENT
    
    # Document linkage
    source_document_id = db.Column(db.String(36), db.ForeignKey('trade_documents.id'))
    document_confidence = db.Column(db.Float)  # Confidence from document extraction
    
    # Product identification
    sku = db.Column(db.String(100))
    product_description = db.Column(db.String(500))
    product_category = db.Column(db.String(100))
    product_subcategory = db.Column(db.String(100))
    brand = db.Column(db.String(100))
    
    # Enhanced financial tracking
    unit_cost = db.Column(db.Float)
    total_cost = db.Column(db.Float)
    actual_cost = db.Column(db.Float)  # From invoices
    planned_cost = db.Column(db.Float)  # From POs
    cost_variance = db.Column(db.Float)  # Calculated difference
    cost_variance_percentage = db.Column(db.Float)
    
    # Enhanced inventory tracking
    quantity = db.Column(db.Float)
    committed_quantity = db.Column(db.Float)  # From POs
    received_quantity = db.Column(db.Float)  # From receipts
    available_stock = db.Column(db.Float)
    in_transit_stock = db.Column(db.Float)
    inventory_status = db.Column(db.String(50))  # available, committed, in_transit, compromised
    
    # Supply chain timeline
    transaction_date = db.Column(db.Date)
    po_date = db.Column(db.Date)  # From PO documents
    ship_date = db.Column(db.Date)  # From BOL
    eta_date = db.Column(db.Date)  # Expected arrival
    received_date = db.Column(db.Date)  # Actual receipt
    
    # Risk and compliance
    compliance_status = db.Column(db.String(50))  # compliant, at_risk, violated
    risk_score = db.Column(db.Float)  # 0-100
    anomaly_flags = db.Column(db.JSON)  # List of detected anomalies
    
    # Supplier/Customer info
    supplier_name = db.Column(db.String(255))
    supplier_id = db.Column(db.String(100))
    customer_name = db.Column(db.String(255))
    customer_id = db.Column(db.String(100))
    
    # Location data
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    region = db.Column(db.String(100))
    warehouse_code = db.Column(db.String(50))
    
    # Currency
    currency = db.Column(db.String(3), default='USD')
    
    # Metadata
    upload_id = db.Column(db.Integer, db.ForeignKey('uploads.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('unified_transactions', lazy=True))
    source_document = db.relationship('TradeDocument', backref='unified_transactions')
    upload = db.relationship('Upload', backref='unified_transactions')
    
    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'org_id': self.org_id,
            'transaction_type': self.transaction_type,
            'source_document_id': self.source_document_id,
            'document_confidence': self.document_confidence,
            'sku': self.sku,
            'product_description': self.product_description,
            'product_category': self.product_category,
            'unit_cost': self.unit_cost,
            'total_cost': self.total_cost,
            'actual_cost': self.actual_cost,
            'planned_cost': self.planned_cost,
            'cost_variance': self.cost_variance,
            'cost_variance_percentage': self.cost_variance_percentage,
            'quantity': self.quantity,
            'committed_quantity': self.committed_quantity,
            'received_quantity': self.received_quantity,
            'available_stock': self.available_stock,
            'in_transit_stock': self.in_transit_stock,
            'inventory_status': self.inventory_status,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'po_date': self.po_date.isoformat() if self.po_date else None,
            'ship_date': self.ship_date.isoformat() if self.ship_date else None,
            'eta_date': self.eta_date.isoformat() if self.eta_date else None,
            'received_date': self.received_date.isoformat() if self.received_date else None,
            'compliance_status': self.compliance_status,
            'risk_score': self.risk_score,
            'anomaly_flags': self.anomaly_flags,
            'supplier_name': self.supplier_name,
            'customer_name': self.customer_name,
            'city': self.city,
            'country': self.country,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DocumentInventoryLink(db.Model):
    """Cross-reference model linking documents to inventory for compromise detection"""
    __tablename__ = 'document_inventory_links'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = db.Column(db.String(100), db.ForeignKey('organizations.id'), nullable=False)
    
    # Document linkage
    po_document_id = db.Column(db.String(36), db.ForeignKey('trade_documents.id'))
    invoice_document_id = db.Column(db.String(36), db.ForeignKey('trade_documents.id'))
    bol_document_id = db.Column(db.String(36), db.ForeignKey('trade_documents.id'))
    
    # Product identification
    sku = db.Column(db.String(100), nullable=False)
    product_description = db.Column(db.String(500))
    
    # Quantity tracking
    po_quantity = db.Column(db.Float)  # Ordered
    shipped_quantity = db.Column(db.Float)  # Shipped per BOL
    received_quantity = db.Column(db.Float)  # Actually received
    available_inventory = db.Column(db.Float)  # Current available
    
    # Cost tracking
    po_unit_cost = db.Column(db.Float)  # Agreed price
    invoice_unit_cost = db.Column(db.Float)  # Billed price
    landed_cost = db.Column(db.Float)  # Total cost including shipping/duties
    
    # Status and alerts
    inventory_status = db.Column(db.String(50), default='normal')  # normal, compromised, at_risk
    compromise_reasons = db.Column(db.JSON)  # List of issues
    
    # Timeline
    po_date = db.Column(db.Date)
    ship_date = db.Column(db.Date)
    eta_date = db.Column(db.Date)
    received_date = db.Column(db.Date)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = db.relationship('Organization', backref=db.backref('document_inventory_links', lazy=True))
    po_document = db.relationship('TradeDocument', foreign_keys=[po_document_id], backref='po_links')
    invoice_document = db.relationship('TradeDocument', foreign_keys=[invoice_document_id], backref='invoice_links')
    bol_document = db.relationship('TradeDocument', foreign_keys=[bol_document_id], backref='bol_links')
    
    def to_dict(self):
        return {
            'id': self.id,
            'org_id': self.org_id,
            'po_document_id': self.po_document_id,
            'invoice_document_id': self.invoice_document_id,
            'bol_document_id': self.bol_document_id,
            'sku': self.sku,
            'product_description': self.product_description,
            'po_quantity': self.po_quantity,
            'shipped_quantity': self.shipped_quantity,
            'received_quantity': self.received_quantity,
            'available_inventory': self.available_inventory,
            'po_unit_cost': self.po_unit_cost,
            'invoice_unit_cost': self.invoice_unit_cost,
            'landed_cost': self.landed_cost,
            'inventory_status': self.inventory_status,
            'compromise_reasons': self.compromise_reasons,
            'po_date': self.po_date.isoformat() if self.po_date else None,
            'ship_date': self.ship_date.isoformat() if self.ship_date else None,
            'eta_date': self.eta_date.isoformat() if self.eta_date else None,
            'received_date': self.received_date.isoformat() if self.received_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }