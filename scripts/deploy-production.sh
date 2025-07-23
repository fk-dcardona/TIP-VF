#!/bin/bash

# Phase 5: Production Deployment & Monitoring Script
# Comprehensive deployment script with health checks, monitoring, and rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="finkargo-analytics"
DEPLOYMENT_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
LOG_DIR="./logs"
HEALTH_CHECK_ENDPOINTS=(
    "http://localhost:3000/api/health"
    "http://localhost:3000/api/health/detailed"
    "http://localhost:3000/dashboard"
)

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create necessary directories
setup_directories() {
    log "Setting up deployment directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./monitoring"
    success "Directories created"
}

# Pre-deployment health check
pre_deployment_check() {
    log "Running pre-deployment health checks..."
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        error "git is not installed"
        exit 1
    fi
    
    # Check current git status
    if [[ -n $(git status --porcelain) ]]; then
        warning "Uncommitted changes detected. Consider committing before deployment."
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 0
        fi
    fi
    
    success "Pre-deployment checks passed"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    if [[ -d "./.next" ]]; then
        tar -czf "$BACKUP_DIR/backup_$DEPLOYMENT_TIMESTAMP.tar.gz" ./.next ./package-lock.json
        success "Backup created: backup_$DEPLOYMENT_TIMESTAMP.tar.gz"
    else
        warning "No existing .next directory found for backup"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Clean install
    rm -rf node_modules
    npm install --legacy-peer-deps
    
    # Install production dependencies only
    npm ci --only=production --legacy-peer-deps
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running test suite..."
    
    # Run unit tests
    if npm run test:unit &> "$LOG_DIR/unit_tests_$DEPLOYMENT_TIMESTAMP.log"; then
        success "Unit tests passed"
    else
        warning "Unit tests failed - check $LOG_DIR/unit_tests_$DEPLOYMENT_TIMESTAMP.log"
    fi
    
    # Run type checking
    if npm run type-check &> "$LOG_DIR/type_check_$DEPLOYMENT_TIMESTAMP.log"; then
        success "Type checking passed"
    else
        error "Type checking failed - check $LOG_DIR/type_check_$DEPLOYMENT_TIMESTAMP.log"
        exit 1
    fi
    
    # Run linting
    if npm run lint &> "$LOG_DIR/lint_$DEPLOYMENT_TIMESTAMP.log"; then
        success "Linting passed"
    else
        warning "Linting failed - check $LOG_DIR/lint_$DEPLOYMENT_TIMESTAMP.log"
    fi
}

# Build application
build_application() {
    log "Building application for production..."
    
    # Clean build
    rm -rf .next
    npm run build
    
    success "Application built successfully"
}

# Start application
start_application() {
    log "Starting application..."
    
    # Kill any existing processes
    pkill -f "next start" || true
    pkill -f "npm start" || true
    
    # Start in background
    nohup npm start > "$LOG_DIR/app_$DEPLOYMENT_TIMESTAMP.log" 2>&1 &
    APP_PID=$!
    
    # Wait for application to start
    sleep 10
    
    success "Application started with PID: $APP_PID"
}

# Health check function
health_check() {
    local endpoint=$1
    local max_retries=30
    local retry_count=0
    
    log "Checking health at: $endpoint"
    
    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s "$endpoint" > /dev/null 2>&1; then
            success "Health check passed for: $endpoint"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        sleep 2
    done
    
    error "Health check failed for: $endpoint after $max_retries retries"
    return 1
}

# Run health checks
run_health_checks() {
    log "Running comprehensive health checks..."
    
    local all_passed=true
    
    for endpoint in "${HEALTH_CHECK_ENDPOINTS[@]}"; do
        if ! health_check "$endpoint"; then
            all_passed=false
        fi
    done
    
    if [[ "$all_passed" == true ]]; then
        success "All health checks passed"
    else
        error "Some health checks failed"
        return 1
    fi
}

# Performance monitoring
setup_performance_monitoring() {
    log "Setting up performance monitoring..."
    
    # Create monitoring script
    cat > "./monitoring/performance-monitor.sh" << 'EOF'
#!/bin/bash

# Performance monitoring script
LOG_FILE="./logs/performance_$(date +%Y%m%d).log"

while true; do
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Check memory usage
    MEMORY_USAGE=$(ps aux | grep "next start" | grep -v grep | awk '{print $6}' | head -1)
    
    # Check CPU usage
    CPU_USAGE=$(ps aux | grep "next start" | grep -v grep | awk '{print $3}' | head -1)
    
    # Check disk usage
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}')
    
    # Log metrics
    echo "[$TIMESTAMP] Memory: ${MEMORY_USAGE}KB, CPU: ${CPU_USAGE}%, Disk: $DISK_USAGE" >> "$LOG_FILE"
    
    # Alert if memory usage is high
    if [[ -n "$MEMORY_USAGE" && "$MEMORY_USAGE" -gt 500000 ]]; then
        echo "[$TIMESTAMP] WARNING: High memory usage detected: ${MEMORY_USAGE}KB" >> "$LOG_FILE"
    fi
    
    sleep 60
done
EOF
    
    chmod +x "./monitoring/performance-monitor.sh"
    
    # Start monitoring in background
    nohup ./monitoring/performance-monitor.sh > /dev/null 2>&1 &
    MONITOR_PID=$!
    
    success "Performance monitoring started with PID: $MONITOR_PID"
}

# Error tracking setup
setup_error_tracking() {
    log "Setting up error tracking..."
    
    # Create error log monitoring
    cat > "./monitoring/error-monitor.sh" << 'EOF'
#!/bin/bash

# Error monitoring script
ERROR_LOG="./logs/errors_$(date +%Y%m%d).log"
APP_LOG="./logs/app_*.log"

while true; do
    # Monitor for errors in application logs
    if grep -i "error\|exception\|failed" $APP_LOG 2>/dev/null; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] Error detected in application logs" >> "$ERROR_LOG"
        grep -i "error\|exception\|failed" $APP_LOG >> "$ERROR_LOG" 2>/dev/null
    fi
    
    # Check for application crashes
    if ! pgrep -f "next start" > /dev/null; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] CRITICAL: Application process not found!" >> "$ERROR_LOG"
    fi
    
    sleep 30
done
EOF
    
    chmod +x "./monitoring/error-monitor.sh"
    
    # Start error monitoring in background
    nohup ./monitoring/error-monitor.sh > /dev/null 2>&1 &
    ERROR_MONITOR_PID=$!
    
    success "Error tracking started with PID: $ERROR_MONITOR_PID"
}

# Rollback function
rollback() {
    log "Initiating rollback..."
    
    # Stop current application
    pkill -f "next start" || true
    pkill -f "npm start" || true
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
    
    if [[ -n "$LATEST_BACKUP" ]]; then
        log "Restoring from backup: $LATEST_BACKUP"
        tar -xzf "$LATEST_BACKUP"
        success "Rollback completed"
    else
        error "No backup found for rollback"
        exit 1
    fi
}

# Main deployment function
deploy() {
    log "Starting Phase 5: Production Deployment & Monitoring"
    
    # Setup
    setup_directories
    pre_deployment_check
    backup_current_deployment
    
    # Build and test
    install_dependencies
    run_tests
    build_application
    
    # Deploy
    start_application
    
    # Verify deployment
    if run_health_checks; then
        success "Deployment successful!"
        
        # Setup monitoring
        setup_performance_monitoring
        setup_error_tracking
        
        # Save deployment info
        echo "Deployment completed at: $(date)" > "$LOG_DIR/deployment_$DEPLOYMENT_TIMESTAMP.info"
        echo "Build timestamp: $DEPLOYMENT_TIMESTAMP" >> "$LOG_DIR/deployment_$DEPLOYMENT_TIMESTAMP.info"
        echo "Application PID: $APP_PID" >> "$LOG_DIR/deployment_$DEPLOYMENT_TIMESTAMP.info"
        echo "Monitor PID: $MONITOR_PID" >> "$LOG_DIR/deployment_$DEPLOYMENT_TIMESTAMP.info"
        echo "Error monitor PID: $ERROR_MONITOR_PID" >> "$LOG_DIR/deployment_$DEPLOYMENT_TIMESTAMP.info"
        
        log "Application is now running at: http://localhost:3000"
        log "Monitoring logs available in: ./logs/"
        log "Performance monitoring active"
        log "Error tracking active"
        
    else
        error "Deployment failed health checks"
        rollback
        exit 1
    fi
}

# Command line interface
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "health")
        run_health_checks
        ;;
    "monitor")
        setup_performance_monitoring
        setup_error_tracking
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_application
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|monitor|test|build}"
        echo "  deploy   - Full production deployment with monitoring"
        echo "  rollback - Rollback to previous deployment"
        echo "  health   - Run health checks"
        echo "  monitor  - Setup monitoring only"
        echo "  test     - Run test suite"
        echo "  build    - Build application only"
        exit 1
        ;;
esac 