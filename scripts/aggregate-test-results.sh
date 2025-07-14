#!/bin/bash

# Test Results Aggregator
# Combines all test results into comprehensive reports

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get results directory from argument
RESULTS_DIR=${1:-"test-results/latest"}

if [ ! -d "$RESULTS_DIR" ]; then
    echo -e "${RED}Error: Results directory not found: $RESULTS_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Test Results Aggregator${NC}"
echo -e "${BLUE}================================================${NC}\n"
echo "Analyzing results in: $RESULTS_DIR"
echo ""

# Create reports directory
REPORTS_DIR="$RESULTS_DIR/reports"
mkdir -p "$REPORTS_DIR"

# 1. Generate HTML Report
echo -e "${YELLOW}Generating HTML report...${NC}"

cat > "$REPORTS_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Results Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .metric {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            margin: 0.5rem 0;
        }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .warning { color: #f59e0b; }
        .test-suite {
            background: white;
            margin-bottom: 1rem;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .suite-header {
            padding: 1rem;
            background: #f3f4f6;
            border-bottom: 1px solid #e5e7eb;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-status {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        .status-passed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        .suite-content {
            padding: 1rem;
            display: none;
        }
        .suite-content.active {
            display: block;
        }
        pre {
            background: #1f2937;
            color: #f3f4f6;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.875rem;
        }
        .chart-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Results Report</h1>
        <p>Generated: <span id="timestamp"></span></p>
    </div>
    
    <div class="summary" id="summary">
        <!-- Summary metrics will be inserted here -->
    </div>
    
    <div class="chart-container">
        <canvas id="resultsChart"></canvas>
    </div>
    
    <h2>Test Suite Details</h2>
    <div id="testSuites">
        <!-- Test suite details will be inserted here -->
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
EOF

# Add JavaScript to populate the report
cat >> "$REPORTS_DIR/index.html" << EOF
        // Load test results
        const results = $(cat "$RESULTS_DIR/summary.json" 2>/dev/null || echo '{}');
        
        // Set timestamp
        document.getElementById('timestamp').textContent = new Date(results.timestamp || Date.now()).toLocaleString();
        
        // Populate summary metrics
        const summaryHtml = \`
            <div class="metric">
                <div>Total Tests</div>
                <div class="metric-value">\${results.total_suites || 0}</div>
            </div>
            <div class="metric">
                <div>Passed</div>
                <div class="metric-value passed">\${results.passed || 0}</div>
            </div>
            <div class="metric">
                <div>Failed</div>
                <div class="metric-value failed">\${results.failed || 0}</div>
            </div>
            <div class="metric">
                <div>Pass Rate</div>
                <div class="metric-value \${(results.pass_rate || 0) >= 80 ? 'passed' : 'warning'}">\${results.pass_rate || '0%'}</div>
            </div>
        \`;
        document.getElementById('summary').innerHTML = summaryHtml;
        
        // Create chart
        const ctx = document.getElementById('resultsChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed'],
                datasets: [{
                    data: [results.passed || 0, results.failed || 0],
                    backgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
        
        // Load individual test results
        const testSuites = [];
EOF

# Process each test result file
for status_file in "$RESULTS_DIR"/**/*.status; do
    if [ -f "$status_file" ]; then
        suite_name=$(basename "$(dirname "$status_file")")/$(basename "$status_file" .status)
        status=$(cat "$status_file")
        log_file="${status_file%.status}.log"
        
        # Escape content for JavaScript
        if [ -f "$log_file" ]; then
            # Get last 100 lines of log
            log_content=$(tail -100 "$log_file" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
        else
            log_content="No log file found"
        fi
        
        cat >> "$REPORTS_DIR/index.html" << EOF
        testSuites.push({
            name: "${suite_name}",
            status: "${status}",
            log: "${log_content}"
        });
EOF
    fi
done

# Complete HTML report
cat >> "$REPORTS_DIR/index.html" << 'EOF'
        
        // Render test suites
        const suitesHtml = testSuites.map((suite, index) => `
            <div class="test-suite">
                <div class="suite-header" onclick="toggleSuite(${index})">
                    <span>${suite.name}</span>
                    <span class="suite-status status-${suite.status.toLowerCase()}">${suite.status}</span>
                </div>
                <div class="suite-content" id="suite-${index}">
                    <pre>${suite.log}</pre>
                </div>
            </div>
        `).join('');
        
        document.getElementById('testSuites').innerHTML = suitesHtml;
        
        function toggleSuite(index) {
            const content = document.getElementById(`suite-${index}`);
            content.classList.toggle('active');
        }
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ HTML report generated${NC}"

# 2. Generate Markdown Report
echo -e "${YELLOW}Generating Markdown report...${NC}"

cat > "$REPORTS_DIR/report.md" << EOF
# Test Results Report

Generated: $(date)

## Summary

$(cat "$RESULTS_DIR/summary.json" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"- **Total Test Suites:** {data.get('total_suites', 0)}\")
print(f\"- **Passed:** {data.get('passed', 0)}\")
print(f\"- **Failed:** {data.get('failed', 0)}\")
print(f\"- **Pass Rate:** {data.get('pass_rate', '0%')}\")
if data.get('failed_suites'):
    print(f\"\\n### Failed Suites\\n\")
    for suite in data['failed_suites']:
        print(f\"- {suite}\")
" 2>/dev/null || echo "Error parsing summary")

## Test Details

EOF

# Add test details to markdown
for status_file in "$RESULTS_DIR"/**/*.status; do
    if [ -f "$status_file" ]; then
        suite_name=$(basename "$(dirname "$status_file")")/$(basename "$status_file" .status)
        status=$(cat "$status_file")
        
        echo "### $suite_name" >> "$REPORTS_DIR/report.md"
        echo "**Status:** $status" >> "$REPORTS_DIR/report.md"
        echo "" >> "$REPORTS_DIR/report.md"
        
        # Add timing information if available
        timing_file="${status_file%.status}.time"
        if [ -f "$timing_file" ]; then
            duration=$(cat "$timing_file")
            echo "**Duration:** ${duration}s" >> "$REPORTS_DIR/report.md"
            echo "" >> "$REPORTS_DIR/report.md"
        fi
    fi
done

echo -e "${GREEN}✅ Markdown report generated${NC}"

# 3. Generate CSV Report
echo -e "${YELLOW}Generating CSV report...${NC}"

echo "Test Suite,Status,Duration (s),Timestamp" > "$REPORTS_DIR/results.csv"

for status_file in "$RESULTS_DIR"/**/*.status; do
    if [ -f "$status_file" ]; then
        suite_name=$(basename "$(dirname "$status_file")")/$(basename "$status_file" .status)
        status=$(cat "$status_file")
        timing_file="${status_file%.status}.time"
        
        if [ -f "$timing_file" ]; then
            duration=$(cat "$timing_file")
        else
            duration="N/A"
        fi
        
        echo "$suite_name,$status,$duration,$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$REPORTS_DIR/results.csv"
    fi
done

echo -e "${GREEN}✅ CSV report generated${NC}"

# 4. Create Test Coverage Summary
echo -e "${YELLOW}Creating coverage summary...${NC}"

if [ -d "$RESULTS_DIR/coverage" ]; then
    cat > "$REPORTS_DIR/coverage-summary.md" << EOF
# Test Coverage Summary

## JavaScript/TypeScript Coverage
EOF
    
    if [ -d "$RESULTS_DIR/coverage/jest" ]; then
        echo "Jest coverage report available at: coverage/jest/index.html" >> "$REPORTS_DIR/coverage-summary.md"
    fi
    
    echo "" >> "$REPORTS_DIR/coverage-summary.md"
    echo "## Python Coverage" >> "$REPORTS_DIR/coverage-summary.md"
    
    if [ -d "$RESULTS_DIR/coverage/pytest" ]; then
        echo "Pytest coverage report available at: coverage/pytest/index.html" >> "$REPORTS_DIR/coverage-summary.md"
    fi
    
    echo -e "${GREEN}✅ Coverage summary created${NC}"
fi

# 5. Performance Metrics Summary
echo -e "${YELLOW}Analyzing performance metrics...${NC}"

if [ -f "$RESULTS_DIR/performance/lighthouse.json" ]; then
    python3 -c "
import json
with open('$RESULTS_DIR/performance/lighthouse.json') as f:
    data = json.load(f)
    if 'categories' in data:
        print('## Lighthouse Performance Scores')
        for category, details in data['categories'].items():
            print(f\"- **{category.title()}:** {details.get('score', 0) * 100:.0f}/100\")
    " > "$REPORTS_DIR/performance-summary.md" 2>/dev/null || echo "Error parsing Lighthouse results"
fi

# 6. Create Quick Summary
echo -e "${YELLOW}Creating quick summary...${NC}"

cat > "$RESULTS_DIR/QUICK_SUMMARY.txt" << EOF
TEST RESULTS SUMMARY
===================
Date: $(date)
Directory: $RESULTS_DIR

$(cat "$RESULTS_DIR/summary.json" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"Total Tests: {data.get('total_suites', 0)}\")
print(f\"Passed: {data.get('passed', 0)}\")
print(f\"Failed: {data.get('failed', 0)}\")
print(f\"Pass Rate: {data.get('pass_rate', '0%')}\")
" 2>/dev/null || echo "Error reading summary")

View detailed reports:
- HTML Report: $REPORTS_DIR/index.html
- Markdown Report: $REPORTS_DIR/report.md
- CSV Data: $REPORTS_DIR/results.csv

To view HTML report:
  open $REPORTS_DIR/index.html  # macOS
  xdg-open $REPORTS_DIR/index.html  # Linux
EOF

echo -e "${GREEN}✅ Quick summary created${NC}"

# Final summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Aggregation Complete${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Reports generated in: $REPORTS_DIR"
echo ""
echo "Available reports:"
echo "  - HTML Report: $REPORTS_DIR/index.html"
echo "  - Markdown Report: $REPORTS_DIR/report.md"
echo "  - CSV Data: $REPORTS_DIR/results.csv"
echo "  - Quick Summary: $RESULTS_DIR/QUICK_SUMMARY.txt"
echo ""
echo -e "${GREEN}✅ All reports generated successfully!${NC}"