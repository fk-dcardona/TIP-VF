-- Migration: 001_create_agent_tables.sql
-- Description: Create database tables for agent system
-- Date: 2025-01-14
-- Author: Agent Protocol System

-- Agent execution metrics table
CREATE TABLE IF NOT EXISTS agent_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    
    -- Execution metadata
    execution_start_time DATETIME NOT NULL,
    execution_end_time DATETIME,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_agent_metrics_agent_id (agent_id),
    INDEX idx_agent_metrics_org_id (organization_id),
    INDEX idx_agent_metrics_execution_id (execution_id),
    INDEX idx_agent_metrics_created_at (created_at)
);

-- Agent execution logs table
CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Log metadata
    timestamp DATETIME NOT NULL,
    log_level VARCHAR(20) NOT NULL, -- DEBUG, INFO, WARNING, ERROR, CRITICAL
    event_type VARCHAR(50) NOT NULL, -- execution_start, tool_call, error, etc.
    message TEXT NOT NULL,
    
    -- Context data
    context_data JSON,
    
    -- User tracking
    user_id VARCHAR(255),
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_agent_logs_agent_id (agent_id),
    INDEX idx_agent_logs_execution_id (execution_id),
    INDEX idx_agent_logs_org_id (organization_id),
    INDEX idx_agent_logs_timestamp (timestamp),
    INDEX idx_agent_logs_level (log_level)
);

-- Agent security contexts table
CREATE TABLE IF NOT EXISTS agent_security_contexts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    agent_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Security metadata
    role VARCHAR(50) NOT NULL, -- agent_operator, agent_admin, agent_viewer
    permissions JSON NOT NULL, -- Serialized permissions array
    restrictions JSON, -- Security restrictions
    
    -- Session tracking
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    INDEX idx_security_contexts_session_id (session_id),
    INDEX idx_security_contexts_agent_id (agent_id),
    INDEX idx_security_contexts_user_id (user_id),
    INDEX idx_security_contexts_org_id (organization_id),
    INDEX idx_security_contexts_expires_at (expires_at)
);

-- Agent configuration history table
CREATE TABLE IF NOT EXISTS agent_config_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Configuration data
    config_version INTEGER NOT NULL,
    config_data JSON NOT NULL,
    
    -- Change tracking
    changed_by VARCHAR(255) NOT NULL,
    change_reason TEXT,
    change_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    INDEX idx_config_history_agent_id (agent_id),
    INDEX idx_config_history_org_id (organization_id),
    INDEX idx_config_history_version (config_version),
    INDEX idx_config_history_timestamp (change_timestamp)
);

-- Agent performance aggregates table (for faster queries)
CREATE TABLE IF NOT EXISTS agent_performance_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Time bucket for aggregation
    time_bucket VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    bucket_start DATETIME NOT NULL,
    bucket_end DATETIME NOT NULL,
    
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicates
    UNIQUE(agent_id, time_bucket, bucket_start),
    
    -- Indexes
    INDEX idx_performance_aggregates_agent_id (agent_id),
    INDEX idx_performance_aggregates_org_id (organization_id),
    INDEX idx_performance_aggregates_time_bucket (time_bucket),
    INDEX idx_performance_aggregates_bucket_start (bucket_start)
);

-- Agent tool usage tracking table
CREATE TABLE IF NOT EXISTS agent_tool_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Tool metadata
    tool_name VARCHAR(100) NOT NULL,
    tool_category VARCHAR(50), -- database, api, file, prompt, system
    
    -- Usage metrics
    call_timestamp DATETIME NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_tool_usage_agent_id (agent_id),
    INDEX idx_tool_usage_execution_id (execution_id),
    INDEX idx_tool_usage_org_id (organization_id),
    INDEX idx_tool_usage_tool_name (tool_name),
    INDEX idx_tool_usage_timestamp (call_timestamp)
);

-- Agent system health table
CREATE TABLE IF NOT EXISTS agent_system_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
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
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_system_health_component (component_name),
    INDEX idx_system_health_status (status),
    INDEX idx_system_health_checked_at (checked_at)
);

-- Create views for common queries
CREATE VIEW IF NOT EXISTS agent_performance_summary AS
SELECT 
    a.id,
    a.name,
    a.type,
    a.organization_id,
    a.status,
    COUNT(am.id) as total_executions,
    SUM(CASE WHEN am.status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
    SUM(CASE WHEN am.status = 'failed' THEN 1 ELSE 0 END) as failed_executions,
    AVG(am.execution_time_ms) as avg_execution_time_ms,
    SUM(am.llm_cost) as total_cost,
    SUM(am.tokens_used) as total_tokens,
    AVG(am.confidence_score) as avg_confidence
FROM agents a
LEFT JOIN agent_metrics am ON a.id = am.agent_id
GROUP BY a.id, a.name, a.type, a.organization_id, a.status;

CREATE VIEW IF NOT EXISTS organization_agent_summary AS
SELECT 
    organization_id,
    COUNT(*) as total_agents,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_agents,
    SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_agents,
    SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled_agents
FROM agents
GROUP BY organization_id;

-- Insert initial system health record
INSERT OR IGNORE INTO agent_system_health (component_name, status, health_score, health_details, checked_at)
VALUES 
    ('executor', 'healthy', 100, '{"initialized": true, "thread_pool_size": 10}', CURRENT_TIMESTAMP),
    ('metrics', 'healthy', 100, '{"initialized": true, "collection_enabled": true}', CURRENT_TIMESTAMP),
    ('logger', 'healthy', 100, '{"initialized": true, "log_level": "INFO"}', CURRENT_TIMESTAMP),
    ('mcp_server', 'healthy', 100, '{"initialized": true, "tools_registered": 0}', CURRENT_TIMESTAMP);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_agent_metrics_timestamp
    AFTER UPDATE ON agent_metrics
    FOR EACH ROW
    BEGIN
        UPDATE agent_metrics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_agent_performance_aggregates_timestamp
    AFTER UPDATE ON agent_performance_aggregates
    FOR EACH ROW
    BEGIN
        UPDATE agent_performance_aggregates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;