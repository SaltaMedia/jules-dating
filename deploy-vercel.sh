#!/bin/bash

# Jules Dating - Vercel Deployment Script
# This script deploys the frontend to Vercel with proper configuration

set -e

echo "🚀 Starting Jules Dating Vercel Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the jules-dating root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found. Creating from template..."
    cp env.production.example .env.production
    echo "📝 Please edit .env.production with your production values before deploying"
    echo "   - NEXT_PUBLIC_API_URL should point to your backend service"
    echo "   - NEXT_PUBLIC_APP_URL should be your frontend URL"
    exit 1
fi

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the project
echo "🔨 Building frontend..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment complete!"
echo "🌐 Your app should be available at: https://dating.juleslabs.com"
echo ""
echo "📋 Next steps:"
echo "   1. Verify the deployment at the URL above"
echo "   2. Check that API calls are working"
echo "   3. Test the full user flow"
