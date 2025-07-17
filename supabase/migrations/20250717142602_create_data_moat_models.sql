-- Migration: Create Data Moat Models
-- Description: Add enhanced intelligence models to create competitive advantage
-- Date: 2025-01-14
-- Author: Finkargo Data Moat Strategy

-- Note: Most of these tables are already created in the enhanced_document_intelligence_models migration
-- This migration adds any missing tables and ensures proper constraints

-- Create organizations table if it doesn't exist (required for foreign keys)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trade_documents table if it doesn't exist (required for foreign keys)
CREATE TABLE IF NOT EXISTS trade_documents (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL REFERENCES organizations(id),
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500),
    extracted_data JSON,
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add any missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trade_finance_transactions_org_id ON trade_finance_transactions (org_id);
CREATE INDEX IF NOT EXISTS idx_trade_finance_transactions_type ON trade_finance_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_trade_finance_transactions_date ON trade_finance_transactions (transaction_date);

CREATE INDEX IF NOT EXISTS idx_customer_intelligence_org_id ON customer_intelligence (org_id);
CREATE INDEX IF NOT EXISTS idx_customer_intelligence_type ON customer_intelligence (customer_type);
CREATE INDEX IF NOT EXISTS idx_customer_intelligence_sector ON customer_intelligence (industry_sector);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_category ON market_intelligence (product_category);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_region ON market_intelligence (geographic_region);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_period ON market_intelligence (time_period);

CREATE INDEX IF NOT EXISTS idx_marketplace_intelligence_type ON marketplace_intelligence (intelligence_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_intelligence_category ON marketplace_intelligence (product_category);
CREATE INDEX IF NOT EXISTS idx_marketplace_intelligence_region ON marketplace_intelligence (geographic_region);

CREATE INDEX IF NOT EXISTS idx_feedback_collection_org_id ON feedback_collection (org_id);
CREATE INDEX IF NOT EXISTS idx_feedback_collection_type ON feedback_collection (feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_collection_status ON feedback_collection (status);

CREATE INDEX IF NOT EXISTS idx_api_integrations_org_id ON api_integrations (org_id);
CREATE INDEX IF NOT EXISTS idx_api_integrations_type ON api_integrations (integration_type);
CREATE INDEX IF NOT EXISTS idx_api_integrations_provider ON api_integrations (provider_name);

CREATE INDEX IF NOT EXISTS idx_competitor_intelligence_name ON competitor_intelligence (competitor_name);
CREATE INDEX IF NOT EXISTS idx_competitor_intelligence_type ON competitor_intelligence (competitor_type);
CREATE INDEX IF NOT EXISTS idx_competitor_intelligence_focus ON competitor_intelligence (market_focus);

CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_org_id ON data_quality_metrics (org_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_tier ON data_quality_metrics (quality_tier);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_period ON data_quality_metrics (period_start, period_end);

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'Organizations using the platform';
COMMENT ON TABLE trade_documents IS 'Trade documents processed by Agent Astra';
COMMENT ON TABLE trade_finance_transactions IS 'Detailed trade finance transactions for intelligence extraction';
COMMENT ON TABLE customer_intelligence IS 'Deep customer profiling for understanding needs and predicting behavior';
COMMENT ON TABLE market_intelligence IS 'Aggregated market data for specific product categories and regions';
COMMENT ON TABLE marketplace_intelligence IS 'Anonymized and aggregated data for the marketplace';
COMMENT ON TABLE feedback_collection IS 'Systematic collection of customer feedback for intelligence extraction';
COMMENT ON TABLE api_integrations IS 'Track and manage API integrations for continuous data collection';
COMMENT ON TABLE competitor_intelligence IS 'Track competitor activities and market positioning';
COMMENT ON TABLE data_quality_metrics IS 'Track data quality to ensure marketplace value';
