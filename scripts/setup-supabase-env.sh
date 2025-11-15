#!/bin/bash

# Setup Supabase Environment Variables
# This uses the Supabase CLI to get credentials

PROJECT_REF="trmaoahftumgjoufbcqk"
DB_PASSWORD="mtTptJ9Tw2WfU4tY"

echo "🔗 Getting Supabase credentials..."

# Get API keys
API_KEYS=$(supabase projects api-keys --project-ref $PROJECT_REF 2>/dev/null)

if [ $? -eq 0 ]; then
    ANON_KEY=$(echo "$API_KEYS" | grep "anon" | awk '{print $3}' | head -1)
    SERVICE_KEY=$(echo "$API_KEYS" | grep "service_role" | awk '{print $3}' | head -1)
    
    echo "✅ Got API keys from Supabase CLI"
else
    echo "⚠️  Could not get keys from CLI. Please get them from Supabase Dashboard:"
    echo "   Settings > API"
    read -p "Enter ANON_KEY: " ANON_KEY
    read -p "Enter SERVICE_ROLE_KEY: " SERVICE_KEY
fi

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Build DATABASE_URL - try direct connection first
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="${DATABASE_URL}"

# Session Security
PULSE_SESSION_SECRET="${SESSION_SECRET}"

# Supabase
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SUPABASE_ANON_KEY="${ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SERVICE_KEY}"

# Tenor API (optional)
TENOR_API_KEY=""
EOF

echo ""
echo "✅ Environment file created at .env"
echo ""
echo "📋 Next steps:"
echo "1. Test database connection:"
echo "   npx prisma db push"
echo ""
echo "2. If connection fails, check your Supabase project:"
echo "   - Go to Settings > Database"
echo "   - Copy the connection string (URI format)"
echo "   - Update DATABASE_URL in .env"
echo ""
echo "3. Seed database:"
echo "   npm run db:seed"
echo ""

