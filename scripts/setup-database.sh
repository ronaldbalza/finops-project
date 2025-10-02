#!/bin/bash

# Database Setup Script for FinOps Platform

set -e

echo "🚀 FinOps Platform Database Setup"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f apps/backend/.env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Created .env file"
    echo ""
    echo "📝 Please update the DATABASE_URL in apps/backend/.env with your database connection string."
    echo ""
    echo "Options:"
    echo "1. Neon (Recommended): Sign up at https://neon.tech"
    echo "2. Supabase: Sign up at https://supabase.com"
    echo "3. Local PostgreSQL: Use Docker Compose (docker-compose up -d postgres)"
    echo ""
    echo "After updating the DATABASE_URL, run this script again."
    exit 1
fi

# Navigate to backend directory
cd apps/backend

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔍 Checking database connection..."
npx prisma db pull --force 2>/dev/null && echo "✅ Database connection successful!" || {
    echo "❌ Could not connect to database."
    echo ""
    echo "Please check your DATABASE_URL in .env file."
    echo "Make sure your database is running and accessible."
    exit 1
}

echo ""
echo "🏗️  Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "🌱 Seeding database with initial data..."
# Check if seed file exists
if [ -f prisma/seed.ts ]; then
    npx prisma db seed
else
    echo "⚠️  No seed file found. Skipping seeding."
fi

echo ""
echo "🔄 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✨ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Check Prisma Studio: npx prisma studio"
echo "3. View the database schema: npx prisma db pull"