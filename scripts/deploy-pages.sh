#!/bin/bash

# Deploy Frontend to Cloudflare Pages

set -e

echo "🚀 Deploying Frontend to Cloudflare Pages..."

# Check if environment is specified
ENV=${1:-development}

# Navigate to web app
cd apps/web

# Build the application
echo "📦 Building the application..."
npm run build

# Deploy based on environment
case $ENV in
  production)
    echo "🌍 Deploying to Production..."
    npx wrangler pages deploy dist --project-name=finops-platform --branch=main
    ;;
  staging)
    echo "🧪 Deploying to Staging..."
    npx wrangler pages deploy dist --project-name=finops-staging --branch=staging
    ;;
  *)
    echo "🔧 Deploying to Development..."
    npx wrangler pages deploy dist --project-name=finops-dev --branch=develop
    ;;
esac

echo "✅ Deployment complete!"