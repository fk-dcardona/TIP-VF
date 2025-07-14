# Agent Protocol - Supply Chain AI Agent Framework

## Overview

The Agent Protocol provides a comprehensive framework for implementing AI agents in the Supply Chain B2B SaaS platform. It follows an evidence-based approach with full lifecycle management, tool integration, and extensive monitoring capabilities.

## Architecture

```
agent_protocol/
├── core/                    # Core agent components
│   ├── base_agent.py       # Abstract base agent class
│   ├── agent_types.py      # Agent type definitions
│   ├── agent_context.py    # Execution context with evidence tracking
│   └── agent_result.py     # Standardized result structure
├── executors/              # Execution and lifecycle management
│   ├── agent_executor.py   # Main executor with async support
│   ├── execution_manager.py # Execution tracking and metrics
│   └── agent_registry.py   # Agent instance management
├── tools/                  # Agent capabilities
│   ├── base_tool.py       # Tool abstraction
│   ├── database_tools.py  # Database query tools
│   ├── api_tools.py       # External API tools
│   └── analysis_tools.py  # Analysis and calculation tools
├── prompts/               # System prompt management
│   ├── prompt_manager.py  # Dynamic prompt generation
│   └── prompt_templates.py # Agent-specific prompts
└── agents/                # Concrete agent implementations
    ├── inventory_agent.py
    ├── supplier_agent.py
    └── demand_agent.py
```

## Key Features

### 1. Evidence-Based Approach
- Every agent decision is backed by concrete evidence
- Confidence scoring for all findings
- Complete reasoning trace
- Source attribution for transparency

### 2. Comprehensive Lifecycle Management
- Execution tracking from start to finish
- State management with history
- Performance metrics and monitoring
- Graceful error handling and recovery

### 3. Flexible Tool System
- Pluggable tool architecture
- Parameter validation
- Execution tracking
- Error handling

### 4. Advanced Execution Capabilities
- Synchronous and asynchronous execution
- Batch processing
- Timeout management
- Concurrent execution control

## Usage Example

```python
from agent_protocol import AgentExecutor
from agent_protocol.agents import InventoryMonitorAgent
from agent_protocol.core import AgentType

# Initialize executor
executor = AgentExecutor(max_workers=5, default_timeout=300)

# Register agent class
executor.register_agent_class(AgentType.INVENTORY_MONITOR, InventoryMonitorAgent)

# Create agent instance
agent = executor.create_agent(
    agent_id="inv_agent_001",
    agent_type=AgentType.INVENTORY_MONITOR,
    name="Primary Inventory Monitor",
    description="Monitors inventory levels and generates alerts",
    config={
        "check_frequency": "hourly",
        "alert_thresholds": {
            "critical": 3,  # days of inventory
            "warning": 7
        }
    }
)

# Execute agent
result = executor.execute_agent(
    agent_id="inv_agent_001",
    input_data={
        "action": "analyze_inventory",
        "skus": ["SKU001", "SKU002"],
        "include_forecast": True
    },
    org_id="org_123",
    user_id="user_456"
)

# Check results
if result.success:
    print(f"Analysis complete: {result.message}")
    print(f"Confidence: {result.confidence}")
    print(f"Key findings: {result.data}")
    print(f"Recommendations: {result.recommendations}")
else:
    print(f"Analysis failed: {result.error}")
```

## Agent Types

### 1. Inventory Monitor Agent
- Monitors stock levels across locations
- Identifies stockout risks
- Recommends reorder points
- Detects consumption anomalies

### 2. Supplier Evaluator Agent
- Evaluates supplier performance
- Assesses supply chain risks
- Compares suppliers
- Monitors compliance

### 3. Demand Forecaster Agent
- Analyzes historical patterns
- Generates demand forecasts
- Quantifies uncertainty
- Recommends safety stock

### 4. Document Analyzer Agent
- Extracts data from documents
- Validates information
- Cross-references with system data
- Generates structured insights

### 5. Risk Assessor Agent
- Identifies potential disruptions
- Assesses probability and impact
- Monitors risk indicators
- Recommends mitigation

### 6. Optimization Agent
- Analyzes end-to-end performance
- Identifies improvement opportunities
- Balances competing objectives
- Quantifies benefits

## Tools Available

### Database Tools
- **DatabaseQueryTool**: Query supply chain data
- **TriangleAnalyticsTool**: Analyze triangle metrics
- **DocumentSearchTool**: Search and analyze documents

### API Tools
- **AgentAstraTool**: Document intelligence API
- **ExternalAPITool**: Generic external API calls

### Analysis Tools
- **DataAnalysisTool**: Statistical analysis
- **MetricsCalculatorTool**: Calculate KPIs
- **InsightGeneratorTool**: Generate insights

## Monitoring and Metrics

### Execution Metrics
- Total executions per agent
- Success/failure rates
- Average execution time
- Token usage

### Performance Tracking
- Tool usage statistics
- Error patterns
- Resource utilization
- Concurrent execution stats

### Execution History
- Complete execution trace
- Input/output data
- Evidence collected
- Reasoning steps

## Integration with Flask API

```python
# In routes/agents.py
from flask import Blueprint, request, jsonify
from agent_protocol.executors import get_global_executor

agents_bp = Blueprint('agents', __name__)
executor = get_global_executor()

@agents_bp.route('/api/agents', methods=['GET'])
def list_agents():
    """List all registered agents."""
    agents = executor.list_agents()
    return jsonify({"agents": agents})

@agents_bp.route('/api/agents/<agent_id>/execute', methods=['POST'])
def execute_agent(agent_id):
    """Execute a specific agent."""
    data = request.get_json()
    result = executor.execute_agent(
        agent_id=agent_id,
        input_data=data.get('input', {}),
        org_id=data.get('org_id'),
        user_id=data.get('user_id')
    )
    return jsonify(result.to_dict())

@agents_bp.route('/api/agents/<agent_id>/metrics', methods=['GET'])
def get_agent_metrics(agent_id):
    """Get metrics for a specific agent."""
    metrics = executor.get_metrics(agent_id)
    return jsonify({"metrics": metrics})
```

## Security Considerations

1. **Permission System**: Agents have defined capabilities
2. **Organization Scoping**: Data access limited by org_id
3. **Execution Limits**: Timeouts and resource constraints
4. **Audit Trail**: Complete execution history
5. **Error Isolation**: Failures don't affect other executions

## Next Steps

1. Implement concrete agents for each type
2. Add more specialized tools
3. Integrate with LLM providers (OpenAI, Anthropic)
4. Implement MCP server for advanced tool registration
5. Add real-time execution monitoring
6. Create agent orchestration workflows

## Configuration

```python
# config/agent_config.py
AGENT_CONFIG = {
    "executor": {
        "max_workers": 5,
        "default_timeout": 300,
        "max_history": 1000
    },
    "llm": {
        "provider": "anthropic",
        "model": "claude-3-sonnet",
        "max_tokens": 4096,
        "temperature": 0.7
    },
    "tools": {
        "database_timeout": 30,
        "api_timeout": 60,
        "max_retries": 3
    }
}
```

This framework provides a solid foundation for implementing intelligent agents that can analyze supply chain data, make evidence-based decisions, and provide actionable insights to users.