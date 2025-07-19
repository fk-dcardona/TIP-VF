#!/bin/bash

# Environment Snapshot Capture Script
# Captures comprehensive environment state for debugging and reproducibility

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Output directory
SNAPSHOT_DIR=${1:-"environment-snapshots/$(date +%Y%m%d_%H%M%S)"}
mkdir -p "$SNAPSHOT_DIR"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📸 Environment Snapshot Capture${NC}"
echo -e "${BLUE}================================================${NC}\n"
echo "Saving to: $SNAPSHOT_DIR"
echo ""

# Function to safely run command and save output
capture() {
    local name=$1
    local command=$2
    local output_file="$SNAPSHOT_DIR/$name"
    
    echo -e "${YELLOW}Capturing $name...${NC}"
    if eval "$command" > "$output_file" 2>&1; then
        echo -e "${GREEN}✅ $name captured${NC}"
    else
        echo "Command failed with exit code: $?" >> "$output_file"
        echo -e "${GREEN}✅ $name captured (with errors)${NC}"
    fi
}

# 1. System Information
echo -e "${BLUE}=== System Information ===${NC}"
capture "system-info.txt" "uname -a && echo && sw_vers 2>/dev/null || lsb_release -a 2>/dev/null || cat /etc/os-release 2>/dev/null"
capture "hardware-info.txt" "system_profiler SPHardwareDataType 2>/dev/null || lscpu 2>/dev/null"
capture "disk-usage.txt" "df -h"
capture "memory-info.txt" "vm_stat 2>/dev/null || free -h 2>/dev/null"
capture "process-list.txt" "ps aux"
capture "network-interfaces.txt" "ifconfig 2>/dev/null || ip addr 2>/dev/null"
echo ""

# 2. Development Environment
echo -e "${BLUE}=== Development Environment ===${NC}"
capture "env-variables.txt" "env | sort | grep -v 'KEY\|TOKEN\|SECRET\|PASSWORD'"
capture "shell-info.txt" "echo \$SHELL && \$SHELL --version"
capture "path-info.txt" "echo \$PATH | tr ':' '\n'"

# Programming languages
capture "python-version.txt" "python3 --version && which python3"
capture "node-version.txt" "node --version && which node"
capture "npm-version.txt" "npm --version && which npm"

# Git information
capture "git-status.txt" "git status --porcelain"
capture "git-log.txt" "git log --oneline -50"
capture "git-branches.txt" "git branch -a"
capture "git-remotes.txt" "git remote -v"
capture "git-config.txt" "git config --list | grep -v 'user.email\|user.name'"
echo ""

# 3. Project Dependencies
echo -e "${BLUE}=== Project Dependencies ===${NC}"

# Python dependencies
if [ -f "requirements.txt" ]; then
    cp requirements.txt "$SNAPSHOT_DIR/requirements.txt"
    if command -v pip &> /dev/null; then
        capture "pip-freeze.txt" "pip freeze"
        capture "pip-list.txt" "pip list --format=columns"
    fi
fi

# Node dependencies
if [ -f "package.json" ]; then
    cp package.json "$SNAPSHOT_DIR/package.json"
    cp package-lock.json "$SNAPSHOT_DIR/package-lock.json" 2>/dev/null || true
    if [ -d "node_modules" ]; then
        capture "npm-list.txt" "npm list --depth=0"
        capture "npm-list-full.txt" "npm list"
    fi
fi
echo ""

# 4. Configuration Files
echo -e "${BLUE}=== Configuration Files ===${NC}"
mkdir -p "$SNAPSHOT_DIR/configs"

# Copy configuration files (excluding sensitive data)
for config in tsconfig.json next.config.js tailwind.config.js postcss.config.js jest.config.js pytest.ini .eslintrc.json; do
    if [ -f "$config" ]; then
        cp "$config" "$SNAPSHOT_DIR/configs/" 2>/dev/null
        echo -e "${GREEN}✅ Copied $config${NC}"
    fi
done

# Create sanitized .env snapshot
if [ -f ".env" ]; then
    sed 's/=.*/=<REDACTED>/' .env > "$SNAPSHOT_DIR/configs/env-structure.txt"
    echo -e "${GREEN}✅ Created sanitized env structure${NC}"
fi
echo ""

# 5. Directory Structure
echo -e "${BLUE}=== Directory Structure ===${NC}"
capture "directory-tree.txt" "find . -type d -name 'node_modules' -prune -o -type d -name '.git' -prune -o -type d -name 'venv*' -prune -o -type d -print | head -200"
capture "file-list.txt" "find . -type f -name 'node_modules' -prune -o -type f -name '.git' -prune -o -type f -name 'venv*' -prune -o -type f -print | head -500"
capture "file-count.txt" "find . -type f | wc -l"
echo ""

# 6. Running Services
echo -e "${BLUE}=== Running Services ===${NC}"
capture "listening-ports.txt" "lsof -i -P -n 2>/dev/null | grep LISTEN || netstat -tuln 2>/dev/null"
capture "docker-ps.txt" "docker ps 2>/dev/null || echo 'Docker not running'"
echo ""

# 7. Error Logs
echo -e "${BLUE}=== Recent Error Logs ===${NC}"
mkdir -p "$SNAPSHOT_DIR/logs"

# Capture npm error logs
if [ -f "npm-debug.log" ]; then
    cp npm-debug.log "$SNAPSHOT_DIR/logs/"
fi

# Capture any test output
for log in test-results/*/logs/*.log; do
    if [ -f "$log" ]; then
        cp "$log" "$SNAPSHOT_DIR/logs/" 2>/dev/null
    fi
done
echo ""

# 8. Performance Metrics
echo -e "${BLUE}=== Performance Metrics ===${NC}"
capture "cpu-usage.txt" "top -l 1 2>/dev/null | head -20 || top -bn1 2>/dev/null | head -20"
capture "io-stats.txt" "iostat 2>/dev/null || echo 'iostat not available'"
echo ""

# 9. Create Metadata
echo -e "${BLUE}=== Creating Metadata ===${NC}"
cat > "$SNAPSHOT_DIR/metadata.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hostname": "$(hostname)",
  "user": "$(whoami)",
  "working_directory": "$(pwd)",
  "snapshot_version": "1.0",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'not in git repo')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'not in git repo')"
}
EOF
echo -e "${GREEN}✅ Metadata created${NC}\n"

# 10. Create Archive
echo -e "${BLUE}=== Creating Archive ===${NC}"
ARCHIVE_NAME="environment-snapshot-$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" -C "$(dirname "$SNAPSHOT_DIR")" "$(basename "$SNAPSHOT_DIR")"
echo -e "${GREEN}✅ Archive created: $ARCHIVE_NAME${NC}\n"

# Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Snapshot Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo "Snapshot directory: $SNAPSHOT_DIR"
echo "Archive file: $ARCHIVE_NAME"
echo "Total size: $(du -sh "$SNAPSHOT_DIR" | cut -f1)"
echo ""
echo "Contents:"
find "$SNAPSHOT_DIR" -type f | wc -l | xargs echo "- Files captured:"
echo ""
echo -e "${GREEN}✅ Environment snapshot complete!${NC}"