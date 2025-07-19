-- Migration: 001_create_agent_tables.sql
-- Description: Create database tables for agent system
-- Date: 2025-01-14
-- Author: Agent Protocol System

-- Agent execution metrics table
CREATE TABLE IF NOT EXISTS agent_metrics (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    
    -- Execution metadata
    execution_start_time TIMESTAMP NOT NULL,
    execution_end_time TIMESTAMP,
    execution_time_ms INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed
    
    -- LLM usage tracking
    llm_provider VARCHAR(50),
    llm_model VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    llm_cost DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Performance metrics
    tools_called INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Error tracking
    error_message TEXT,
    error_type VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent execution logs table
CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Log metadata
    timestamp TIMESTAMP NOT NULL,
    log_level VARCHAR(20) NOT NULL, -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    event_type VARCHAR(50) NOT NULL, -- execution_start, tool_call, error, etc.
    message TEXT NOT NULL,
    
    -- Context data
    context_data JSON,
    
    -- User tracking
    user_id VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent security contexts table
CREATE TABLE IF NOT EXISTS agent_security_contexts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    agent_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Security metadata
    role VARCHAR(50) NOT NULL, -- agent_operator, agent_admin, agent_viewer
    permissions JSON NOT NULL, -- Serialized permissions array
    restrictions JSON, -- Security restrictions
    
    -- Session tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE
);

-- Agent configuration history table
CREATE TABLE IF NOT EXISTS agent_config_history (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Configuration data
    config_version INTEGER NOT NULL,
    config_data JSON NOT NULL,
    
    -- Change tracking
    changed_by VARCHAR(255) NOT NULL,
    change_reason TEXT,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    is_active BOOLEAN DEFAULT FALSE
);

-- Agent performance aggregates table (for faster queries)
CREATE TABLE IF NOT EXISTS agent_performance_aggregates (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Time bucket for aggregation
    time_bucket VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    bucket_start TIMESTAMP NOT NULL,
    bucket_end TIMESTAMP NOT NULL,
    
    -- Aggregated metrics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_execution_time_ms DECIMAL(10,2) DEFAULT 0.0,
    min_execution_time_ms INTEGER DEFAULT 0,
    max_execution_time_ms INTEGER DEFAULT 0,
    
    -- Cost metrics
    total_llm_cost DECIMAL(10,4) DEFAULT 0.0000,
    total_tokens_used INTEGER DEFAULT 0,
    total_llm_calls INTEGER DEFAULT 0,
    
    -- Confidence metrics
    avg_confidence_score DECIMAL(3,2) DEFAULT 0.00,
    min_confidence_score DECIMAL(3,2) DEFAULT 0.00,
    max_confidence_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Error metrics
    total_errors INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicates
    UNIQUE(agent_id, time_bucket, bucket_start)
);

-- Agent tool usage tracking table
CREATE TABLE IF NOT EXISTS agent_tool_usage (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Tool metadata
    tool_name VARCHAR(100) NOT NULL,
    tool_category VARCHAR(50), -- database, api, file, prompt, system
    
    -- Usage metrics
    call_timestamp TIMESTAMP NOT NULL,
    execution_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    
    -- Input/output tracking
    input_size INTEGER DEFAULT 0,
    output_size INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_type VARCHAR(100),
    
    -- Cost tracking
    cost DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent system health table
CREATE TABLE IF NOT EXISTS agent_system_health (
    id SERIAL PRIMARY KEY,
    
    -- Component identification
    component_name VARCHAR(100) NOT NULL, -- executor, metrics, logger, mcp_server
    component_version VARCHAR(50),
    
    -- Health status
    status VARCHAR(20) NOT NULL, -- healthy, degraded, unhealthy
    health_score INTEGER DEFAULT 100, -- 0-100
    
    -- Metrics
    response_time_ms INTEGER DEFAULT 0,
    error_rate DECIMAL(5,2) DEFAULT 0.00,
    memory_usage_mb INTEGER DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0.00,
    
    -- Health details
    health_details JSON,
    last_error TEXT,
    
    -- Timestamp
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_org_id ON agent_metrics (organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_execution_id ON agent_metrics (execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_created_at ON agent_metrics (created_at);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id ON agent_logs (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_execution_id ON agent_logs (execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_org_id ON agent_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level ON agent_logs (log_level);

CREATE INDEX IF NOT EXISTS idx_security_contexts_session_id ON agent_security_contexts (session_id);
CREATE INDEX IF NOT EXISTS idx_security_contexts_agent_id ON agent_security_contexts (agent_id);
CREATE INDEX IF NOT EXISTS idx_security_contexts_user_id ON agent_security_contexts (user_id);
CREATE INDEX IF NOT EXISTS idx_security_contexts_org_id ON agent_security_contexts (organization_id);
CREATE INDEX IF NOT EXISTS idx_security_contexts_expires_at ON agent_security_contexts (expires_at);

CREATE INDEX IF NOT EXISTS idx_config_history_agent_id ON agent_config_history (agent_id);
CREATE INDEX IF NOT EXISTS idx_config_history_org_id ON agent_config_history (organization_id);
CREATE INDEX IF NOT EXISTS idx_config_history_version ON agent_config_history (config_version);
CREATE INDEX IF NOT EXISTS idx_config_history_timestamp ON agent_config_history (change_timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_aggregates_agent_id ON agent_performance_aggregates (agent_id);
CREATE INDEX IF NOT EXISTS idx_performance_aggregates_org_id ON agent_performance_aggregates (organization_id);
CREATE INDEX IF NOT EXISTS idx_performance_aggregates_time_bucket ON agent_performance_aggregates (time_bucket);
CREATE INDEX IF NOT EXISTS idx_performance_aggregates_bucket_start ON agent_performance_aggregates (bucket_start);

CREATE INDEX IF NOT EXISTS idx_tool_usage_agent_id ON agent_tool_usage (agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_execution_id ON agent_tool_usage (execution_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_org_id ON agent_tool_usage (organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON agent_tool_usage (tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_timestamp ON agent_tool_usage (call_timestamp);

CREATE INDEX IF NOT EXISTS idx_system_health_component ON agent_system_health (component_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON agent_system_health (status);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON agent_system_health (checked_at);

-- Insert initial system health record
INSERT INTO agent_system_health (component_name, status, health_score, health_details, checked_at)
VALUES 
    ('executor', 'healthy', 100, '{"initialized": true, "thread_pool_size": 10}', CURRENT_TIMESTAMP),
    ('metrics', 'healthy', 100, '{"initialized": true, "collection_enabled": true}', CURRENT_TIMESTAMP),
    ('logger', 'healthy', 100, '{"initialized": true, "log_level": "INFO"}', CURRENT_TIMESTAMP),
    ('mcp_server', 'healthy', 100, '{"initialized": true, "tools_registered": 0}', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_agent_metrics_timestamp
    BEFORE UPDATE ON agent_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_aggregates_timestamp
    BEFORE UPDATE ON agent_performance_aggregates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
