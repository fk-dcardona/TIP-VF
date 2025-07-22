#!/bin/bash

# Analytics Dashboard Setup Script
echo "🚀 Setting up Analytics Dashboard..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories if they don't exist
echo "📁 Creating directory structure..."
mkdir -p src/core
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/types

# Verify TypeScript configuration
echo "⚙️  Verifying TypeScript configuration..."
npx tsc --noEmit

# Build the project
echo "🔨 Building the project..."
npm run build

echo "✅ Setup complete! You can now run:"
echo "   npm run dev    # Start development server"
echo "   npm run build  # Build for production"
echo "   npm run preview # Preview production build" 