#!/bin/bash
# Verify TIP Platform deployment

echo "🔍 Verifying TIP Platform deployment..."
echo "======================================"

# Check for required files
REQUIRED_FILES=(
  "services/document-processor.ts"
  "services/whatsapp-alerts.ts"
  "src/components/dashboard/real-time-dashboard.tsx"
  "src/components/onboarding/enhanced-company-setup.tsx"
  "src/lib/utils/currency.ts"
  "src/lib/country-config.ts"
  "database/complete-schema.sql"
)

MISSING_FILES=0

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (missing)"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -eq 0 ]; then
  echo -e "\n✅ All files deployed successfully!"
else
  echo -e "\n❌ $MISSING_FILES files are missing"
fi
