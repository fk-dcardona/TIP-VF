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
