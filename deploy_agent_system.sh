#!/bin/bash

# =============================================================================
# Production Deployment Script for Agent System
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${DEPLOYMENT_ENV:-production}
DEPLOYMENT_VERSION=${DEPLOYMENT_VERSION:-1.0.0}
DEPLOYMENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOYMENT_COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
DEPLOYMENT_BUILD_NUMBER=${BUILD_NUMBER:-$(date +%s)}

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="${PROJECT_ROOT}/venv311"
REQUIREMENTS_FILE="${PROJECT_ROOT}/requirements.txt"
ENV_FILE="${PROJECT_ROOT}/.env.${DEPLOYMENT_ENV}"
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_DIR="${PROJECT_ROOT}/logs"
DEPLOYMENT_LOG="${LOG_DIR}/deployment_$(date +%Y%m%d_%H%M%S).log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "${DEPLOYMENT_LOG}"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓ $1${NC}" | tee -a "${DEPLOYMENT_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}" | tee -a "${DEPLOYMENT_LOG}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}" | tee -a "${DEPLOYMENT_LOG}"
}

check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check Python version
    if ! python3 --version | grep -q "3.11"; then
        log_error "Python 3.11 required but not found"
        exit 1
    fi
    
    # Check git (for version info)
    if ! command -v git &> /dev/null; then
        log_warning "Git not found - deployment info will be limited"
    fi
    
    # Check environment file
    if [[ ! -f "${ENV_FILE}" ]]; then
        log_error "Environment file not found: ${ENV_FILE}"
        log "Please copy .env.production and configure it for your deployment"
        exit 1
    fi
    
    # Check database configuration
    if ! grep -q "DATABASE_URL" "${ENV_FILE}"; then
        log_error "DATABASE_URL not found in environment file"
        exit 1
    fi
    
    # Check required API keys
    if ! grep -q "OPENAI_API_KEY" "${ENV_FILE}" || ! grep -q "ANTHROPIC_API_KEY" "${ENV_FILE}"; then
        log_error "LLM API keys not found in environment file"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

setup_directories() {
    log "Setting up deployment directories..."
    
    # Create necessary directories
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${LOG_DIR}"
    mkdir -p "${PROJECT_ROOT}/uploads"
    mkdir -p "${PROJECT_ROOT}/database"
    
    # Set permissions
    chmod 755 "${BACKUP_DIR}"
    chmod 755 "${LOG_DIR}"
    chmod 755 "${PROJECT_ROOT}/uploads"
    
    log_success "Directories setup completed"
}

setup_virtual_environment() {
    log "Setting up Python virtual environment..."
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d "${VENV_PATH}" ]]; then
        log "Creating virtual environment at ${VENV_PATH}"
        python3 -m venv "${VENV_PATH}"
    fi
    
    # Activate virtual environment
    source "${VENV_PATH}/bin/activate"
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install/upgrade requirements
    if [[ -f "${REQUIREMENTS_FILE}" ]]; then
        log "Installing Python dependencies from ${REQUIREMENTS_FILE}"
        pip install -r "${REQUIREMENTS_FILE}"
    else
        log "Installing basic dependencies"
        pip install flask flask-cors flask-sqlalchemy pandas numpy python-dotenv psycopg2-binary gunicorn
    fi
    
    log_success "Virtual environment setup completed"
}

backup_database() {
    log "Creating database backup..."
    
    # Source environment variables
    source "${ENV_FILE}"
    
    # Create backup filename
    BACKUP_FILE="${BACKUP_DIR}/database_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Check if PostgreSQL
    if [[ "${DATABASE_URL}" == postgresql* ]]; then
        log "Creating PostgreSQL backup"
        
        # Extract database info from URL
        DB_URL_PARSED=$(echo "${DATABASE_URL}" | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([^\/]+)\/(.+)/\1 \2 \3 \4 \5/')
        read -r DB_USER DB_PASS DB_HOST DB_PORT DB_NAME <<< "$DB_URL_PARSED"
        
        # Create backup
        PGPASSWORD="${DB_PASS}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}" > "${BACKUP_FILE}"
        
        if [[ $? -eq 0 ]]; then
            log_success "Database backup created: ${BACKUP_FILE}"
        else
            log_error "Database backup failed"
            exit 1
        fi
    else
        # SQLite backup
        if [[ -f "${PROJECT_ROOT}/database/app.db" ]]; then
            cp "${PROJECT_ROOT}/database/app.db" "${BACKUP_DIR}/app_backup_$(date +%Y%m%d_%H%M%S).db"
            log_success "SQLite database backup created"
        else
            log_warning "No SQLite database found to backup"
        fi
    fi
}

run_database_migrations() {
    log "Running database migrations..."
    
    # Activate virtual environment
    source "${VENV_PATH}/bin/activate"
    
    # Source environment variables
    source "${ENV_FILE}"
    
    # Run migrations
    python3 "${PROJECT_ROOT}/migrations/run_migrations.py"
    
    if [[ $? -eq 0 ]]; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

configure_environment() {
    log "Configuring deployment environment..."
    
    # Update environment file with deployment info
    {
        echo ""
        echo "# Deployment Metadata (Auto-generated)"
        echo "DEPLOYMENT_ENVIRONMENT=${DEPLOYMENT_ENV}"
        echo "DEPLOYMENT_VERSION=${DEPLOYMENT_VERSION}"
        echo "DEPLOYMENT_BUILD_NUMBER=${DEPLOYMENT_BUILD_NUMBER}"
        echo "DEPLOYMENT_COMMIT_SHA=${DEPLOYMENT_COMMIT_SHA}"
        echo "DEPLOYMENT_TIMESTAMP=${DEPLOYMENT_TIMESTAMP}"
    } >> "${ENV_FILE}"
    
    # Set production-specific configurations
    sed -i 's/DEBUG=True/DEBUG=False/g' "${ENV_FILE}"
    sed -i 's/LOG_LEVEL=DEBUG/LOG_LEVEL=INFO/g' "${ENV_FILE}"
    
    log_success "Environment configuration completed"
}

start_agent_system() {
    log "Starting agent system..."
    
    # Activate virtual environment
    source "${VENV_PATH}/bin/activate"
    
    # Source environment variables
    source "${ENV_FILE}"
    
    # Start agent system
    python3 "${PROJECT_ROOT}/startup_agent_system.py" --daemon &
    AGENT_SYSTEM_PID=$!
    
    # Save PID for monitoring
    echo "${AGENT_SYSTEM_PID}" > "${PROJECT_ROOT}/agent_system.pid"
    
    # Wait for startup
    log "Waiting for agent system to start..."
    sleep 10
    
    # Check if process is running
    if kill -0 "${AGENT_SYSTEM_PID}" 2>/dev/null; then
        log_success "Agent system started successfully (PID: ${AGENT_SYSTEM_PID})"
    else
        log_error "Agent system failed to start"
        exit 1
    fi
}

start_web_server() {
    log "Starting web server..."
    
    # Activate virtual environment
    source "${VENV_PATH}/bin/activate"
    
    # Source environment variables
    source "${ENV_FILE}"
    
    # Start Gunicorn web server
    gunicorn --bind 0.0.0.0:5000 \
             --workers 4 \
             --worker-class gevent \
             --worker-connections 1000 \
             --timeout 120 \
             --keepalive 2 \
             --max-requests 1000 \
             --max-requests-jitter 50 \
             --preload \
             --access-logfile "${LOG_DIR}/access.log" \
             --error-logfile "${LOG_DIR}/error.log" \
             --log-level info \
             --pid "${PROJECT_ROOT}/gunicorn.pid" \
             --daemon \
             main:app
    
    if [[ $? -eq 0 ]]; then
        log_success "Web server started successfully"
    else
        log_error "Web server failed to start"
        exit 1
    fi
}

run_health_checks() {
    log "Running post-deployment health checks..."
    
    # Wait for services to fully start
    sleep 15
    
    # Check web server health
    if curl -f -s "http://localhost:5000/api/health" > /dev/null; then
        log_success "Web server health check passed"
    else
        log_error "Web server health check failed"
        exit 1
    fi
    
    # Check agent system health
    if curl -f -s "http://localhost:5000/api/health/agents" > /dev/null; then
        log_success "Agent system health check passed"
    else
        log_error "Agent system health check failed"
        exit 1
    fi
    
    # Check database health
    if curl -f -s "http://localhost:5000/api/health/detailed" > /dev/null; then
        log_success "Database health check passed"
    else
        log_error "Database health check failed"
        exit 1
    fi
}

create_deployment_report() {
    log "Creating deployment report..."
    
    REPORT_FILE="${LOG_DIR}/deployment_report_$(date +%Y%m%d_%H%M%S).json"
    
    # Get system info
    SYSTEM_INFO=$(curl -s "http://localhost:5000/api/health/detailed" || echo "{}")
    
    # Create report
    cat > "${REPORT_FILE}" << EOF
{
    "deployment": {
        "environment": "${DEPLOYMENT_ENV}",
        "version": "${DEPLOYMENT_VERSION}",
        "build_number": "${DEPLOYMENT_BUILD_NUMBER}",
        "commit_sha": "${DEPLOYMENT_COMMIT_SHA}",
        "timestamp": "${DEPLOYMENT_TIMESTAMP}",
        "duration_seconds": $(($(date +%s) - ${DEPLOYMENT_START_TIME}))
    },
    "system_info": ${SYSTEM_INFO},
    "files": {
        "log_file": "${DEPLOYMENT_LOG}",
        "backup_dir": "${BACKUP_DIR}",
        "environment_file": "${ENV_FILE}"
    },
    "processes": {
        "web_server_pid": "$(cat ${PROJECT_ROOT}/gunicorn.pid 2>/dev/null || echo 'not found')",
        "agent_system_pid": "$(cat ${PROJECT_ROOT}/agent_system.pid 2>/dev/null || echo 'not found')"
    }
}
EOF
    
    log_success "Deployment report created: ${REPORT_FILE}"
}

cleanup_old_files() {
    log "Cleaning up old files..."
    
    # Remove old backups (keep last 7 days)
    find "${BACKUP_DIR}" -name "*.sql" -mtime +7 -delete 2>/dev/null || true
    find "${BACKUP_DIR}" -name "*.db" -mtime +7 -delete 2>/dev/null || true
    
    # Remove old logs (keep last 30 days)
    find "${LOG_DIR}" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Remove old deployment reports (keep last 14 days)
    find "${LOG_DIR}" -name "deployment_report_*.json" -mtime +14 -delete 2>/dev/null || true
    
    log_success "Cleanup completed"
}

print_deployment_summary() {
    log_success "Deployment completed successfully!"
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    echo "Environment: ${DEPLOYMENT_ENV}"
    echo "Version: ${DEPLOYMENT_VERSION}"
    echo "Build Number: ${DEPLOYMENT_BUILD_NUMBER}"
    echo "Commit SHA: ${DEPLOYMENT_COMMIT_SHA}"
    echo "Timestamp: ${DEPLOYMENT_TIMESTAMP}"
    echo ""
    echo "=== SERVICES ==="
    echo "Web Server: http://localhost:5000"
    echo "Health Check: http://localhost:5000/api/health"
    echo "Agent Health: http://localhost:5000/api/health/agents"
    echo "API Documentation: http://localhost:5000/api/docs"
    echo ""
    echo "=== PROCESS IDs ==="
    echo "Web Server PID: $(cat ${PROJECT_ROOT}/gunicorn.pid 2>/dev/null || echo 'not found')"
    echo "Agent System PID: $(cat ${PROJECT_ROOT}/agent_system.pid 2>/dev/null || echo 'not found')"
    echo ""
    echo "=== FILES ==="
    echo "Deployment Log: ${DEPLOYMENT_LOG}"
    echo "Environment File: ${ENV_FILE}"
    echo "Backup Directory: ${BACKUP_DIR}"
    echo ""
    echo "=== MONITORING ==="
    echo "Use 'tail -f ${LOG_DIR}/access.log' to monitor web requests"
    echo "Use 'tail -f ${LOG_DIR}/error.log' to monitor errors"
    echo "Use 'curl http://localhost:5000/api/health/detailed' for detailed health"
}

# Main deployment process
main() {
    DEPLOYMENT_START_TIME=$(date +%s)
    
    log "Starting deployment of Agent System v${DEPLOYMENT_VERSION}"
    log "Environment: ${DEPLOYMENT_ENV}"
    log "Timestamp: ${DEPLOYMENT_TIMESTAMP}"
    
    # Run deployment steps
    check_prerequisites
    setup_directories
    setup_virtual_environment
    backup_database
    run_database_migrations
    configure_environment
    start_agent_system
    start_web_server
    run_health_checks
    create_deployment_report
    cleanup_old_files
    print_deployment_summary
    
    log_success "Deployment completed in $(($(date +%s) - ${DEPLOYMENT_START_TIME})) seconds"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "OPTIONS:"
        echo "  --help, -h          Show this help message"
        echo "  --dry-run           Show what would be done without executing"
        echo "  --skip-backup       Skip database backup"
        echo "  --skip-migrations   Skip database migrations"
        echo "  --version VERSION   Set deployment version"
        echo ""
        echo "ENVIRONMENT VARIABLES:"
        echo "  DEPLOYMENT_ENV      Deployment environment (default: production)"
        echo "  DEPLOYMENT_VERSION  Deployment version (default: 1.0.0)"
        echo "  BUILD_NUMBER        Build number (default: timestamp)"
        exit 0
        ;;
    --dry-run)
        log "DRY RUN: The following steps would be executed:"
        echo "1. Check prerequisites"
        echo "2. Setup directories"
        echo "3. Setup virtual environment"
        echo "4. Backup database"
        echo "5. Run database migrations"
        echo "6. Configure environment"
        echo "7. Start agent system"
        echo "8. Start web server"
        echo "9. Run health checks"
        echo "10. Create deployment report"
        echo "11. Cleanup old files"
        exit 0
        ;;
    --version)
        DEPLOYMENT_VERSION="$2"
        shift 2
        ;;
    --skip-backup)
        SKIP_BACKUP=true
        shift
        ;;
    --skip-migrations)
        SKIP_MIGRATIONS=true
        shift
        ;;
    *)
        # Run main deployment
        main "$@"
        ;;
esac