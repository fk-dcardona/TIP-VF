#!/bin/bash

# Setup script for Twilio MCP servers

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🔧 Twilio MCP Server Setup${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating configuration directories...${NC}"
mkdir -p twilio-config openapi-specs openapi-config

# Create example Twilio configuration
if [ ! -f "twilio-config/config.json" ]; then
    echo -e "${YELLOW}Creating example Twilio configuration...${NC}"
    cat > twilio-config/config.json << 'EOF'
{
  "services": ["messaging", "voice", "verify"],
  "tags": ["sms", "calls", "verification"],
  "maxContextSize": 128000
}
EOF
    echo -e "${GREEN}✅ Created twilio-config/config.json${NC}"
fi

# Create example OpenAPI spec
if [ ! -f "openapi-specs/example-api.yaml" ]; then
    echo -e "${YELLOW}Creating example OpenAPI spec...${NC}"
    cat > openapi-specs/example-api.yaml << 'EOF'
openapi: 3.0.0
info:
  title: Example API
  version: 1.0.0
paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
EOF
    echo -e "${GREEN}✅ Created openapi-specs/example-api.yaml${NC}"
fi

# Check for Twilio credentials
echo -e "\n${YELLOW}Checking Twilio credentials...${NC}"
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Twilio credentials not found in environment.${NC}"
    echo -e "Please add to your .env.local file:"
    echo -e "  TWILIO_ACCOUNT_SID=your_account_sid"
    echo -e "  TWILIO_AUTH_TOKEN=your_auth_token"
    echo -e "\nOr export them:"
    echo -e "  export TWILIO_ACCOUNT_SID=your_account_sid"
    echo -e "  export TWILIO_AUTH_TOKEN=your_auth_token"
else
    echo -e "${GREEN}✅ Twilio credentials found${NC}"
fi

# Instructions
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}📋 Next Steps${NC}"
echo -e "${BLUE}================================================${NC}"

echo -e "\n1. ${YELLOW}Set Twilio credentials${NC} (if not already done):"
echo -e "   Add to .env.local or export as environment variables"

echo -e "\n2. ${YELLOW}Start the MCP servers${NC}:"
echo -e "   docker-compose -f docker-compose-twilio-mcp.yml up -d"

echo -e "\n3. ${YELLOW}Restart Claude Desktop${NC} to load the new MCP servers"

echo -e "\n4. ${YELLOW}Test the servers${NC} in Claude:"
echo -e "   - For Twilio: 'Send an SMS to +1234567890 saying Hello'"
echo -e "   - For OpenAPI: 'Load the OpenAPI spec from /specs/example-api.yaml'"

echo -e "\n${BLUE}Configuration Files:${NC}"
echo -e "- Twilio config: twilio-config/config.json"
echo -e "- OpenAPI specs: openapi-specs/*.yaml"
echo -e "- Docker compose: docker-compose-twilio-mcp.yml"

echo -e "\n${GREEN}✅ Setup complete!${NC}"