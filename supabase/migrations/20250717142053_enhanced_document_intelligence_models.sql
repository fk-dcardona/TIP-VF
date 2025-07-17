-- Migration 002: Create Enhanced Models for Unified Document Intelligence Protocol
-- This migration adds the enhanced models needed for document intelligence and cross-referencing

-- Enhanced UnifiedTransaction Model
CREATE TABLE IF NOT EXISTS unified_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    transaction_type VARCHAR(20), -- SALE, PURCHASE, INVENTORY, DOCUMENT
    
    -- Document linkage
    source_document_id VARCHAR(36) REFERENCES trade_documents(id),
    document_confidence FLOAT,
    
    -- Enhanced financial tracking
    actual_cost FLOAT, -- From invoices
    planned_cost FLOAT, -- From POs
    cost_variance FLOAT, -- Calculated difference
    cost_variance_percentage FLOAT,
    
    -- Enhanced inventory tracking
    committed_quantity FLOAT, -- From POs
    received_quantity FLOAT, -- From receipts
    inventory_status VARCHAR(50), -- available, committed, in_transit, compromised
    
    -- Supply chain timeline
    po_date DATE, -- From PO documents
    ship_date DATE, -- From BOL
    eta_date DATE, -- Expected arrival
    received_date DATE, -- Actual receipt
    
    -- Risk and compliance
    compliance_status VARCHAR(50), -- compliant, at_risk, violated
    risk_score FLOAT, -- 0-100
    anomaly_flags JSON, -- List of detected anomalies
    
    -- Standard transaction fields (inherited from base)
    sku VARCHAR(100),
    product_description TEXT,
    product_category VARCHAR(100),
    quantity FLOAT,
    unit_cost FLOAT,
    total_cost FLOAT,
    transaction_date DATE,
    supplier_name VARCHAR(255),
    supplier_country VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'USD',
    city VARCHAR(100),
    country VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_sku (sku),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_inventory_status (inventory_status),
    INDEX idx_supplier_name (supplier_name),
    INDEX idx_transaction_date (transaction_date)
);

-- Document-Inventory Cross-Reference Model
CREATE TABLE IF NOT EXISTS document_inventory_links (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    
    -- Document linkage
    po_document_id VARCHAR(36) REFERENCES trade_documents(id),
    invoice_document_id VARCHAR(36) REFERENCES trade_documents(id),
    bol_document_id VARCHAR(36) REFERENCES trade_documents(id),
    
    -- Product identification
    sku VARCHAR(100) NOT NULL,
    product_description VARCHAR(500),
    
    -- Quantity tracking
    po_quantity FLOAT, -- Ordered
    shipped_quantity FLOAT, -- Shipped per BOL
    received_quantity FLOAT, -- Actually received
    available_inventory FLOAT, -- Current available
    
    -- Cost tracking
    po_unit_cost FLOAT, -- Agreed price
    invoice_unit_cost FLOAT, -- Billed price
    landed_cost FLOAT, -- Total cost including shipping/duties
    
    -- Status and alerts
    inventory_status VARCHAR(50), -- normal, compromised, at_risk
    compromise_reasons JSON, -- List of issues
    
    -- Timeline
    po_date DATE,
    ship_date DATE,
    eta_date DATE,
    received_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_sku (sku),
    INDEX idx_inventory_status (inventory_status),
    INDEX idx_po_date (po_date),
    INDEX idx_received_date (received_date)
);

-- Enhanced Trade Finance Transaction Model
CREATE TABLE IF NOT EXISTS trade_finance_transactions (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    
    -- Transaction Details
    transaction_type VARCHAR(50), -- LC, factoring, credit_insurance, trade_loan
    amount_usd FLOAT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    completion_date DATE,
    
    -- Parties
    importer_org_id VARCHAR(100), -- Your customer
    supplier_name VARCHAR(255),
    supplier_country VARCHAR(100),
    supplier_region VARCHAR(100), -- Latin America, Asia, Europe, etc.
    
    -- Product Intelligence
    product_category VARCHAR(100),
    product_subcategory VARCHAR(100),
    hs_code VARCHAR(20), -- Harmonized System code
    quantity FLOAT,
    unit_of_measure VARCHAR(20),
    
    -- Payment Terms
    payment_terms_days INTEGER,
    advance_payment_percentage FLOAT,
    credit_insurance_coverage FLOAT,
    financing_rate FLOAT,
    
    -- Risk Metrics
    country_risk_score FLOAT,
    supplier_risk_score FLOAT,
    transaction_risk_score FLOAT,
    currency_risk_score FLOAT,
    
    -- Market Intelligence
    market_demand_score FLOAT, -- Based on other importers
    competitive_pricing_score FLOAT,
    supplier_market_share FLOAT,
    
    -- Financial Impact
    working_capital_impact FLOAT,
    cash_conversion_days INTEGER,
    financing_cost FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_supplier_name (supplier_name),
    INDEX idx_product_category (product_category)
);

-- Customer Intelligence Model
CREATE TABLE IF NOT EXISTS customer_intelligence (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    
    -- Customer Profile
    customer_type VARCHAR(50), -- importer, distributor, retailer, manufacturer
    industry_sector VARCHAR(100),
    company_size VARCHAR(50), -- small, medium, large, enterprise
    geographic_market VARCHAR(100),
    years_in_business INTEGER,
    
    -- Business Intelligence
    annual_revenue_range VARCHAR(50), -- <1M, 1-10M, 10-50M, 50-100M, >100M
    credit_rating VARCHAR(10),
    payment_history_score FLOAT,
    financial_health_score FLOAT,
    
    -- Supply Chain Intelligence
    preferred_suppliers JSON, -- List of supplier names and countries
    typical_order_size FLOAT,
    order_frequency_days INTEGER,
    seasonal_patterns JSON, -- Monthly demand patterns
    product_preferences JSON, -- Categories and subcategories
    
    -- Behavioral Intelligence
    platform_engagement_score FLOAT, -- How actively they use the platform
    feature_usage_pattern JSON, -- Which features they use most
    data_quality_contribution FLOAT, -- How good their data is
    
    -- Feedback & Satisfaction
    satisfaction_score FLOAT,
    net_promoter_score INTEGER,
    pain_points JSON,
    feature_requests JSON,
    
    -- Market Intelligence
    competitors_used JSON, -- Other platforms/solutions they use
    market_share_estimate FLOAT,
    growth_rate FLOAT,
    
    -- Predictive Scores
    churn_risk_score FLOAT,
    upsell_potential_score FLOAT,
    lifetime_value_estimate FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_customer_type (customer_type),
    INDEX idx_industry_sector (industry_sector),
    INDEX idx_company_size (company_size)
);

-- Market Intelligence Model
CREATE TABLE IF NOT EXISTS market_intelligence (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Market Scope
    product_category VARCHAR(100) NOT NULL,
    product_subcategory VARCHAR(100),
    geographic_region VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    time_period DATE NOT NULL,
    
    -- Demand Intelligence
    total_market_demand FLOAT, -- In units or USD
    demand_growth_rate FLOAT, -- Month-over-month %
    seasonal_index FLOAT, -- 1.0 = average, >1 = high season
    demand_volatility FLOAT, -- Standard deviation
    
    -- Supply Intelligence
    total_suppliers INTEGER,
    new_suppliers_count INTEGER, -- New this period
    supplier_concentration FLOAT, -- Herfindahl index
    average_lead_time INTEGER, -- Days
    lead_time_variance FLOAT,
    
    -- Pricing Intelligence
    average_unit_price FLOAT,
    price_volatility FLOAT,
    price_trend VARCHAR(20), -- increasing, decreasing, stable
    price_elasticity FLOAT, -- Demand sensitivity to price
    
    -- Quality Metrics
    average_quality_score FLOAT,
    defect_rate FLOAT,
    return_rate FLOAT,
    
    -- Competitive Intelligence
    top_importers JSON, -- List of anonymized importer profiles
    market_share_distribution JSON, -- Distribution of market share
    new_entrants INTEGER, -- New importers this period
    
    -- Risk Intelligence
    supply_chain_risk_score FLOAT,
    currency_risk_score FLOAT,
    political_risk_score FLOAT,
    logistics_risk_score FLOAT,
    
    -- Data Quality
    data_points_count INTEGER, -- Number of transactions analyzed
    confidence_score FLOAT, -- Statistical confidence
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_market_scope (product_category, geographic_region, time_period, country),
    INDEX idx_product_category (product_category),
    INDEX idx_geographic_region (geographic_region),
    INDEX idx_time_period (time_period)
);

-- Marketplace Intelligence Model
CREATE TABLE IF NOT EXISTS marketplace_intelligence (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Market Scope
    intelligence_type VARCHAR(50), -- demand, supply, pricing, risk
    product_category VARCHAR(100) NOT NULL,
    geographic_region VARCHAR(100) NOT NULL,
    time_period DATE NOT NULL,
    
    -- Aggregated Intelligence
    total_transaction_volume FLOAT,
    transaction_count INTEGER,
    average_order_size FLOAT,
    
    -- Performance Benchmarks
    top_quartile_metrics JSON, -- Best performers
    median_metrics JSON, -- Average performers
    bottom_quartile_metrics JSON, -- Poor performers
    
    -- Supplier Intelligence (Anonymized)
    supplier_performance_scores JSON, -- Aggregated scores by country/region
    supplier_reliability_index FLOAT,
    supplier_diversity_score FLOAT,
    
    -- Market Trends
    demand_trends JSON, -- Historical and projected
    pricing_trends JSON,
    supply_chain_trends JSON,
    
    -- Predictive Intelligence
    demand_forecast JSON, -- Next 3, 6, 12 months
    price_forecast JSON,
    risk_forecast JSON,
    
    -- Competitive Landscape
    market_concentration FLOAT,
    competitive_intensity FLOAT,
    market_maturity_score FLOAT,
    
    -- Data Quality
    confidence_score FLOAT,
    data_points_count INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Monetization
    tier_required VARCHAR(20), -- free, basic, premium, enterprise
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_marketplace_scope (intelligence_type, product_category, geographic_region, time_period),
    INDEX idx_intelligence_type (intelligence_type),
    INDEX idx_product_category (product_category),
    INDEX idx_geographic_region (geographic_region),
    INDEX idx_time_period (time_period)
);

-- Feedback Collection Model
CREATE TABLE IF NOT EXISTS feedback_collection (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    user_id VARCHAR(100) NOT NULL,
    
    -- Feedback Types
    feedback_type VARCHAR(50), -- feature_request, bug_report, satisfaction, competitor_info, market_insight
    feedback_text TEXT,
    feedback_source VARCHAR(50), -- in_app, email, support_ticket, sales_call
    
    -- Sentiment Analysis
    sentiment_score FLOAT, -- -1 to 1
    emotion_tags JSON, -- frustrated, satisfied, excited, etc.
    urgency_score FLOAT,
    
    -- Intelligence Extraction
    key_topics JSON, -- Extracted topics using NLP
    entities_mentioned JSON, -- Companies, products, features
    action_items JSON, -- Identified actions
    
    -- Business Intelligence
    pain_points JSON,
    competitor_mentions JSON, -- Competitors and what's mentioned
    feature_requests JSON,
    pricing_feedback JSON,
    
    -- Follow-up
    status VARCHAR(50), -- new, in_review, actioned, closed
    priority VARCHAR(20), -- low, medium, high, critical
    assigned_to VARCHAR(100),
    resolution TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
);

-- API Integration Model
CREATE TABLE IF NOT EXISTS api_integrations (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    
    -- Integration Details
    integration_type VARCHAR(50), -- erp, accounting, ecommerce, customs, logistics
    provider_name VARCHAR(100), -- SAP, QuickBooks, Shopify, etc.
    api_endpoint VARCHAR(255),
    api_version VARCHAR(20),
    
    -- Authentication
    auth_type VARCHAR(50), -- oauth2, api_key, basic
    credentials_encrypted TEXT, -- Encrypted credentials
    
    -- Data Flow
    sync_frequency VARCHAR(20), -- real_time, hourly, daily, weekly
    last_sync TIMESTAMP,
    next_sync TIMESTAMP,
    data_volume INTEGER, -- Records per sync
    
    -- Data Mapping
    field_mappings JSON, -- How external fields map to our models
    data_transformations JSON, -- Any transformations applied
    
    -- Intelligence Value
    data_quality_score FLOAT,
    intelligence_types JSON, -- What intelligence we extract
    business_value_score FLOAT,
    
    -- Status
    status VARCHAR(50), -- active, paused, error, pending
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_integration_type (integration_type),
    INDEX idx_provider_name (provider_name),
    INDEX idx_status (status)
);

-- Competitor Intelligence Model
CREATE TABLE IF NOT EXISTS competitor_intelligence (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Competitor Profile
    competitor_name VARCHAR(255) NOT NULL,
    competitor_type VARCHAR(50), -- direct, indirect, potential
    market_focus VARCHAR(100), -- Latin America, Global, etc.
    
    -- Market Position
    estimated_market_share FLOAT,
    customer_count_estimate INTEGER,
    revenue_estimate VARCHAR(50), -- Range
    growth_rate_estimate FLOAT,
    
    -- Product Intelligence
    key_features JSON,
    pricing_model JSON,
    target_customers JSON,
    unique_selling_points JSON,
    
    -- Competitive Analysis
    strengths JSON,
    weaknesses JSON,
    opportunities JSON,
    threats JSON,
    
    -- Customer Feedback
    customer_satisfaction FLOAT,
    common_complaints JSON,
    switching_triggers JSON, -- Why customers leave them
    
    -- Intelligence Sources
    data_sources JSON, -- Where we got this info
    confidence_level FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_competitor_name (competitor_name),
    INDEX idx_competitor_type (competitor_type),
    INDEX idx_market_focus (market_focus)
);

-- Data Quality Metrics Model
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    
    -- Quality Dimensions
    completeness_score FLOAT, -- % of required fields filled
    accuracy_score FLOAT, -- % of accurate data points
    consistency_score FLOAT, -- % following standards
    timeliness_score FLOAT, -- % updated on time
    uniqueness_score FLOAT, -- % without duplicates
    
    -- Overall Score
    overall_quality_score FLOAT,
    quality_tier VARCHAR(20), -- gold, silver, bronze
    
    -- Contribution Metrics
    data_points_contributed INTEGER,
    unique_insights_contributed INTEGER,
    marketplace_value_score FLOAT,
    
    -- Incentive Tracking
    credits_earned INTEGER,
    discount_percentage FLOAT,
    premium_features_unlocked JSON,
    
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_org_id (org_id),
    INDEX idx_quality_tier (quality_tier),
    INDEX idx_period_start (period_start),
    INDEX idx_period_end (period_end)
);

-- Add comments for documentation
COMMENT ON TABLE unified_transactions IS 'Enhanced transaction model with document intelligence and cross-referencing capabilities';
COMMENT ON TABLE document_inventory_links IS 'Cross-reference model linking documents to inventory for compromise detection';
COMMENT ON TABLE trade_finance_transactions IS 'Detailed trade finance transactions for intelligence extraction';
COMMENT ON TABLE customer_intelligence IS 'Deep customer profiling for understanding needs and predicting behavior';
COMMENT ON TABLE market_intelligence IS 'Aggregated market data for specific product categories and regions';
COMMENT ON TABLE marketplace_intelligence IS 'Anonymized and aggregated data for the marketplace';
COMMENT ON TABLE feedback_collection IS 'Systematic collection of customer feedback for intelligence extraction';
COMMENT ON TABLE api_integrations IS 'Track and manage API integrations for continuous data collection';
COMMENT ON TABLE competitor_intelligence IS 'Track competitor activities and market positioning';
COMMENT ON TABLE data_quality_metrics IS 'Track data quality to ensure marketplace value';
