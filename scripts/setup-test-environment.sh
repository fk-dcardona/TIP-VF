#!/bin/bash

# Comprehensive Test Environment Setup Script
# Creates an isolated, fully-configured test environment

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT=$(pwd)
TEST_ENV_DIR="test-environment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="test-logs/$TIMESTAMP"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🔧 Comprehensive Test Environment Setup${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Create log directory
mkdir -p "$LOG_DIR"
echo "Logs will be saved to: $LOG_DIR"

# Function to log and display
log() {
    echo -e "$1" | tee -a "$LOG_DIR/setup.log"
}

# 1. System Information Capture
log "${YELLOW}1. Capturing System Information${NC}"
log "================================"

# System details
{
    echo "=== System Information ==="
    echo "Date: $(date)"
    echo "Hostname: $(hostname)"
    echo "OS: $(uname -a)"
    echo "Python: $(python3 --version 2>&1)"
    echo "Node: $(node --version 2>&1)"
    echo "npm: $(npm --version 2>&1)"
    echo "Git branch: $(git branch --show-current)"
    echo "Git commit: $(git rev-parse HEAD)"
    echo ""
} > "$LOG_DIR/system-info.txt"

log "${GREEN}✅ System information captured${NC}\n"

# 2. Create Isolated Python Environment
log "${YELLOW}2. Setting up Python Environment${NC}"
log "================================"

# Create fresh Python venv
if [ -d "$TEST_ENV_DIR/venv" ]; then
    log "Removing existing test venv..."
    rm -rf "$TEST_ENV_DIR/venv"
fi

log "Creating Python 3.11 virtual environment..."
python3.11 -m venv "$TEST_ENV_DIR/venv" 2>&1 | tee -a "$LOG_DIR/setup.log"

# Activate venv
source "$TEST_ENV_DIR/venv/bin/activate"

# Upgrade pip
log "Upgrading pip..."
pip install --upgrade pip setuptools wheel 2>&1 | tee -a "$LOG_DIR/setup.log"

# Install dependencies
log "Installing Python dependencies..."
pip install -r requirements.txt 2>&1 | tee -a "$LOG_DIR/setup.log"

# Install test dependencies
log "Installing test dependencies..."
pip install pytest pytest-cov pytest-asyncio pytest-timeout black flake8 mypy 2>&1 | tee -a "$LOG_DIR/setup.log"

# Save pip freeze
pip freeze > "$LOG_DIR/python-dependencies.txt"

log "${GREEN}✅ Python environment ready${NC}\n"

# 3. Setup Node.js Environment
log "${YELLOW}3. Setting up Node.js Environment${NC}"
log "================================"

# Clean install node modules
if [ -d "node_modules" ]; then
    log "Removing existing node_modules..."
    rm -rf node_modules
fi

log "Installing Node.js dependencies..."
npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_DIR/setup.log"

# Install additional test dependencies
log "Installing additional test tools..."
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom 2>&1 | tee -a "$LOG_DIR/setup.log"

# Save package versions
npm list --depth=0 > "$LOG_DIR/node-dependencies.txt" 2>/dev/null || true

log "${GREEN}✅ Node.js environment ready${NC}\n"

# 4. Configure ESLint
log "${YELLOW}4. Configuring ESLint${NC}"
log "================================"

# Create ESLint config if needed
if [ ! -f ".eslintrc.json" ]; then
    log "Creating ESLint configuration..."
    cat > .eslintrc.json << 'EOF'
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off"
  }
}
EOF
    log "${GREEN}✅ ESLint configured${NC}"
else
    log "${GREEN}✅ ESLint already configured${NC}"
fi

# 5. Create Test Configuration Files
log "${YELLOW}5. Creating Test Configuration${NC}"
log "================================"

# Jest configuration
if [ ! -f "jest.config.js" ]; then
    log "Creating Jest configuration..."
    cat > jest.config.js << 'EOF'
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/development-archive/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
EOF
fi

# Jest setup file
if [ ! -f "jest.setup.js" ]; then
    log "Creating Jest setup file..."
    cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom'
EOF
fi

# Pytest configuration
if [ ! -f "pytest.ini" ]; then
    log "Creating pytest configuration..."
    cat > pytest.ini << 'EOF'
[tool:pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
    --cov=.
    --cov-report=term-missing
    --cov-report=html:test-logs/coverage
    --timeout=30
filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
EOF
fi

log "${GREEN}✅ Test configurations created${NC}\n"

# 6. Create .env.test file
log "${YELLOW}6. Setting up Test Environment Variables${NC}"
log "================================"

if [ -f ".env.example" ]; then
    cp .env.example .env.test
    log "${GREEN}✅ Created .env.test from .env.example${NC}"
else
    log "${YELLOW}⚠️  No .env.example found${NC}"
fi

# 7. Create test directory structure
log "${YELLOW}7. Creating Test Directory Structure${NC}"
log "================================"

mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p src/__tests__

# Create sample test files
cat > tests/unit/test_sample.py << 'EOF'
"""Sample unit test to verify pytest setup"""
def test_sample():
    assert True
EOF

cat > src/__tests__/sample.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react'

describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })
})
EOF

log "${GREEN}✅ Test directory structure created${NC}\n"

# 8. Database Setup (if needed)
log "${YELLOW}8. Database Setup${NC}"
log "================================"

if [ -f "models.py" ]; then
    log "Setting up test database..."
    # Create test database configuration
    cat > config/test_db.py << 'EOF'
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database URL
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///test_app.db")

# Create test engine
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
EOF
    log "${GREEN}✅ Test database configuration created${NC}"
else
    log "Skipping database setup (no models.py found)"
fi

# 9. Create comprehensive test runner
log "${YELLOW}9. Creating Comprehensive Test Runner${NC}"
log "================================"

cat > "$TEST_ENV_DIR/run-all-tests.sh" << 'EOF'
#!/bin/bash

# Comprehensive test runner with full logging
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="test-results/$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo "Starting comprehensive test suite..."
echo "Results will be saved to: $RESULTS_DIR"

# Run all test categories
./scripts/isolated-test-runner.sh "$RESULTS_DIR"

# Generate summary report
./scripts/aggregate-test-results.sh "$RESULTS_DIR"

echo "Test suite complete! Check $RESULTS_DIR for detailed results."
EOF

chmod +x "$TEST_ENV_DIR/run-all-tests.sh"

log "${GREEN}✅ Test runner created${NC}\n"

# 10. Final Summary
log "${BLUE}================================================${NC}"
log "${BLUE}📊 Environment Setup Summary${NC}"
log "${BLUE}================================================${NC}"

{
    echo "=== Setup Summary ==="
    echo "Python venv: $TEST_ENV_DIR/venv"
    echo "Python version: $(python --version)"
    echo "Node version: $(node --version)"
    echo "Test logs: $LOG_DIR"
    echo ""
    echo "=== Installed Tools ==="
    echo "- pytest with coverage"
    echo "- Jest with React Testing Library"
    echo "- ESLint configured"
    echo "- Type checking ready"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Activate Python environment: source $TEST_ENV_DIR/venv/bin/activate"
    echo "2. Run all tests: $TEST_ENV_DIR/run-all-tests.sh"
    echo "3. View results in: test-results/"
} | tee "$LOG_DIR/setup-summary.txt"

log "${GREEN}✅ Test environment setup complete!${NC}"