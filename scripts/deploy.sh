#!/bin/bash
set -e

echo "🚀 Deploying N58 Internal Portal to Vercel..."

# Ensure we're on main and up to date!
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Must be on main branch to deploy. Currently on: $BRANCH"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Uncommitted changes detected. Please commit or stash before deploying."
  git status --short
  exit 1
fi

# Pull latest
echo "📥 Pulling latest from origin/main..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npx tsc --noEmit

# Lint
echo "🧹 Linting..."
npm run lint

# Deploy to Vercel
if [ "$1" == "--prod" ]; then
  echo "🌐 Deploying to PRODUCTION..."
  vercel --prod
else
  echo "🔬 Deploying to preview (pass --prod for production)..."
  vercel
fi

echo "✅ Deploy complete!"
