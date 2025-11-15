#!/bin/bash

# Setup Environment Variables for Pulse
# Usage: ./scripts/setup-env.sh [PROJECT-REF] [ANON-KEY] [SERVICE-ROLE-KEY]

PROJECT_REF=$1
ANON_KEY=$2
SERVICE_ROLE_KEY=$3
DB_PASSWORD="mtTptJ9Tw2WfU4tY"

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: Project reference required"
    echo ""
    echo "Usage: ./scripts/setup-env.sh [PROJECT-REF] [ANON-KEY] [SERVICE-ROLE-KEY]"
    echo ""
    echo "Example:"
    echo "  ./scripts/setup-env.sh abcdefghijklmnop eyJhbGc... eyJhbGc..."
    echo ""
    exit 1
fi

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Build DATABASE_URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL="${DATABASE_URL}"

# Session Security
PULSE_SESSION_SECRET="${SESSION_SECRET}"

# Supabase
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SUPABASE_ANON_KEY="${ANON_KEY:-your-anon-key}"
SUPABASE_SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY:-your-service-role-key}"

# Tenor API (optional)
TENOR_API_KEY=""
EOF

echo "✅ Environment file created!"
echo ""
echo "📋 Next steps:"
echo "1. If you didn't provide keys, edit .env and add:"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2. Run database setup:"
echo "   npx prisma db push"
echo "   npm run db:seed"
echo ""
echo "3. Configure Supabase:"
echo "   - Enable Realtime (run scripts/supabase-setup.sql)"
echo "   - Create storage buckets: images, stickers, avatars"
echo ""

