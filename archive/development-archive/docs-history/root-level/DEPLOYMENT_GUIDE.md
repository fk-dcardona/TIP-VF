# Agent System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Agent System to production environments. The deployment includes database migrations, environment configuration, agent registry initialization, monitoring setup, and health check endpoints.

## Prerequisites

### System Requirements
- Python 3.11 or higher
- PostgreSQL 12+ (recommended) or SQLite (development)
- Redis (for caching and session management)
- Git (for version information)
- curl (for health checks)
- Node.js 18+ (for frontend deployment)

### API Keys Required
- OpenAI API Key
- Anthropic API Key
- Google API Key (optional)
- Agent Astra API Key (for document intelligence)

## Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd supply-chain-agent-system

# Copy and configure environment file
cp .env.production .env.production.local
# Edit .env.production.local with your configuration
```

### 2. Database Setup

```bash
# For PostgreSQL (recommended)
createdb supply_chain_agents

# Update DATABASE_URL in .env.production.local
DATABASE_URL=postgresql://username:password@localhost:5432/supply_chain_agents
```

### 3. Deploy Agent System

```bash
# Make deployment script executable
chmod +x deploy_agent_system.sh

# Run deployment
./deploy_agent_system.sh
```

### 4. Verify Deployment

```bash
# Check system health
curl http://localhost:5000/api/health/detailed

# Check agent system
curl http://localhost:5000/api/health/agents

# Check monitoring
curl http://localhost:5000/api/health/alerts
```

## Detailed Deployment Process

### Step 1: Environment Configuration

#### Production Environment Variables

Create `.env.production.local` with the following configuration:

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_key
CLERK_SECRET_KEY=sk_live_your_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# LLM Providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Agent System
AGENT_EXECUTOR_THREAD_POOL_SIZE=20
AGENT_EXECUTOR_MAX_EXECUTION_TIME=300
AGENT_SECURITY_ENABLED=true
AGENT_SANDBOX_ENABLED=true

# Monitoring
METRICS_ENABLED=true
PERFORMANCE_MONITORING_ENABLED=true
HEALTH_CHECK_ENABLED=true

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/var/log/supply_chain_agent.log
```

#### Environment Validation

The deployment script automatically validates:
- Python version (3.11+)
- Required environment variables
- Database connectivity
- API key presence

### Step 2: Database Migrations

#### Migration Process

The system includes comprehensive database migrations:

```bash
# Run migrations manually
python3 migrations/run_migrations.py

# Check migration status
python3 migrations/run_migrations.py --status

# Rollback specific migration
python3 migrations/run_migrations.py --rollback 001
```

#### Migration Tables Created

- `agent_metrics` - Agent execution metrics
- `agent_logs` - Structured logging
- `agent_security_contexts` - Security sessions
- `agent_config_history` - Configuration changes
- `agent_performance_aggregates` - Performance analytics
- `agent_tool_usage` - Tool usage tracking
- `agent_system_health` - System health monitoring

### Step 3: Agent Registry Initialization

#### Registry Configuration

```python
# Agent registry configuration
registry_config = AgentRegistryConfig(
    auto_start_agents=True,
    health_check_interval=30,
    max_concurrent_agents=100,
    agent_timeout=300,
    enable_mcp_server=True,
    enable_metrics=True,
    enable_health_monitoring=True
)
```

#### Agent Types Supported

- **Inventory Monitor Agent**: Stock level monitoring and reorder alerts
- **Supplier Evaluator Agent**: Supplier performance analysis
- **Demand Forecaster Agent**: Demand prediction and planning

### Step 4: Monitoring and Logging

#### Production Monitoring

The system includes comprehensive monitoring:

```bash
# Start monitoring system
python3 config/monitoring.py --daemon

# View monitoring status
curl http://localhost:5000/api/health/alerts
```

#### Alert Rules

- CPU usage > 80%
- Memory usage > 85%
- Disk space > 90%
- Agent error rate > 10%
- Daily cost limits
- Database connection pool exhaustion

#### Log Aggregation

```bash
# View logs
tail -f logs/supply_chain_agent.log

# View access logs
tail -f logs/access.log

# View error logs
tail -f logs/error.log
```

### Step 5: Health Check Endpoints

#### Health Check URLs

```bash
# Basic health check
GET /api/health

# Detailed system health
GET /api/health/detailed

# Readiness check
GET /api/health/ready

# Liveness check
GET /api/health/live

# Agent-specific health
GET /api/health/agents

# Metrics health
GET /api/health/metrics

# Alert status
GET /api/health/alerts

# System resources
GET /api/health/system
```

#### Health Check Integration

For load balancers and orchestration systems:

```yaml
# Kubernetes example
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Production Deployment Options

### Option 1: Single Server Deployment

```bash
# Deploy to single server
./deploy_agent_system.sh --version 1.0.0

# Monitor deployment
tail -f logs/deployment_*.log
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile.agent-system
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x deploy_agent_system.sh

EXPOSE 5000
CMD ["./deploy_agent_system.sh"]
```

```bash
# Build and run
docker build -f Dockerfile.agent-system -t agent-system .
docker run -p 5000:5000 --env-file .env.production.local agent-system
```

### Option 3: Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-system
  template:
    metadata:
      labels:
        app: agent-system
    spec:
      containers:
      - name: agent-system
        image: agent-system:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5000
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5000
```

### Option 4: Cloud Provider Deployment

#### AWS Deployment

```bash
# Deploy to AWS ECS
aws ecs create-cluster --cluster-name agent-system-cluster

# Deploy to AWS Lambda (for serverless)
pip install chalice
chalice deploy --stage production
```

#### Railway Deployment

```bash
# Deploy to Railway
railway login
railway init
railway up
```

#### Vercel Deployment (Frontend)

```bash
# Deploy frontend to Vercel
vercel --prod
```

## Security Considerations

### Production Security Checklist

- [ ] Environment variables secured
- [ ] Database connection encrypted
- [ ] API keys rotated regularly
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Security headers implemented
- [ ] Audit logging enabled
- [ ] Backup strategy implemented

### Security Configuration

```bash
# Security settings in .env.production.local
SECURITY_HEADERS_ENABLED=true
SECURITY_HSTS_ENABLED=true
SECURITY_CSP_ENABLED=true
RATE_LIMITING_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100
```

## Monitoring and Alerting

### Monitoring Setup

```bash
# Start production monitoring
python3 config/monitoring.py --daemon

# View monitoring dashboard
curl http://localhost:5000/api/health/system
```

### Alert Configuration

```python
# Custom alert rules
alert_rules = [
    AlertRule(
        name="high_agent_queue",
        metric_name="agent.queue_size",
        threshold=100,
        operator=">=",
        severity=AlertSeverity.HIGH
    )
]
```

### Metrics Collection

- System metrics (CPU, memory, disk)
- Agent performance metrics
- Database metrics
- API endpoint metrics
- Cost tracking metrics

## Backup and Recovery

### Database Backup

```bash
# Automated backup (included in deployment)
./deploy_agent_system.sh

# Manual backup
pg_dump supply_chain_agents > backup_$(date +%Y%m%d).sql
```

### Recovery Process

```bash
# Restore from backup
psql supply_chain_agents < backup_20240114.sql

# Restart services
./deploy_agent_system.sh --skip-migrations
```

## Troubleshooting

### Common Issues

#### Issue: Agent System Won't Start
```bash
# Check logs
tail -f logs/error.log

# Check processes
ps aux | grep python

# Check environment
source .env.production.local
python3 -c "from config.settings import settings; print(settings.DATABASE_URL)"
```

#### Issue: Database Connection Failed
```bash
# Test database connection
python3 -c "
from models import db
from main import app
with app.app_context():
    db.session.execute('SELECT 1')
    print('Database connection OK')
"
```

#### Issue: Health Checks Failing
```bash
# Check individual components
curl http://localhost:5000/api/health/detailed

# Check agent registry
curl http://localhost:5000/api/health/agents

# Check system resources
curl http://localhost:5000/api/health/system
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG

# Run in debug mode
python3 startup_agent_system.py --debug
```

## Performance Optimization

### Production Tuning

```bash
# Gunicorn configuration
gunicorn --workers 4 \
         --worker-class gevent \
         --worker-connections 1000 \
         --timeout 120 \
         --keepalive 2 \
         --max-requests 1000 \
         --preload \
         main:app
```

### Agent System Tuning

```bash
# Agent system configuration
AGENT_EXECUTOR_THREAD_POOL_SIZE=20
AGENT_EXECUTOR_MAX_EXECUTION_TIME=300
AGENT_EXECUTOR_QUEUE_SIZE=1000
```

### Database Optimization

```sql
-- Index optimization
CREATE INDEX CONCURRENTLY idx_agent_metrics_created_at ON agent_metrics(created_at);
CREATE INDEX CONCURRENTLY idx_agent_logs_timestamp ON agent_logs(timestamp);

-- Connection pooling
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
```

## Maintenance

### Regular Maintenance Tasks

```bash
# Daily tasks
./deploy_agent_system.sh --skip-backup --skip-migrations

# Weekly tasks
python3 migrations/run_migrations.py --status
find logs/ -name "*.log" -mtime +7 -delete

# Monthly tasks
python3 -c "
from config.monitoring import get_production_monitor
monitor = get_production_monitor()
print(monitor.get_monitoring_status())
"
```

### Updates and Upgrades

```bash
# Update to new version
git pull origin main
./deploy_agent_system.sh --version 1.1.0

# Rollback if needed
git checkout previous-version
./deploy_agent_system.sh --skip-migrations
```

## Support and Documentation

### Getting Help

- Check logs: `tail -f logs/error.log`
- Health status: `curl http://localhost:5000/api/health/detailed`
- System metrics: `curl http://localhost:5000/api/health/system`

### Documentation

- [API Documentation](http://localhost:5000/api/docs)
- [Agent API Reference](./agent_api_documentation.md)
- [Health Check Reference](./routes/health_monitoring.py)

### Deployment Evidence

After successful deployment, the system provides:

1. **Database Migrations**: Complete schema with agent-specific tables
2. **Environment Configuration**: Production-ready configuration
3. **Agent Registry**: Initialized with all agent types
4. **Monitoring Setup**: Comprehensive monitoring and alerting
5. **Health Endpoints**: Full health check coverage
6. **Deployment Report**: Detailed deployment summary

This deployment guide ensures a robust, scalable, and well-monitored production deployment of the Agent System.