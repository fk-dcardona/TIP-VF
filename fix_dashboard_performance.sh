#!/bin/bash
# Dashboard Performance Fix Script

echo "🔧 Applying common performance fixes..."

# 1. Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next
npm run build

# 2. Restart development server
echo "Restarting development server..."
pkill -f "next dev" || true
sleep 2
npm run dev &

# 3. Check for memory usage
echo "Monitoring memory usage..."
ps aux | grep node

echo "✅ Performance fixes applied!"
echo "💡 If still unresponsive, check browser console for specific errors"
