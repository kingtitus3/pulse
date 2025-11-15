#!/bin/bash
# Fix all deployment issues

echo "🔧 Fixing deployment issues..."

# 1. Update .env with pooler connection
echo "1. Updating DATABASE_URL to use connection pooler..."
sed -i.bak 's|DATABASE_URL="postgresql://postgres:mtTptJ9Tw2WfU4tY@db.trmaoahftumgjoufbcqk.supabase.co:5432/postgres"|DATABASE_URL="postgresql://postgres.trmaoahftumgjoufbcqk:mtTptJ9Tw2WfU4tY@aws-0-us-east-1.pooler.supabase.com:6543/postgres"|' .env

# 2. Update Vercel environment variable
echo "2. Updating DATABASE_URL in Vercel..."
echo "postgresql://postgres.trmaoahftumgjoufbcqk:mtTptJ9Tw2WfU4tY@aws-0-us-east-1.pooler.supabase.com:6543/postgres" | vercel env rm DATABASE_URL production --yes 2>/dev/null
echo "postgresql://postgres.trmaoahftumgjoufbcqk:mtTptJ9Tw2WfU4tY@aws-0-us-east-1.pooler.supabase.com:6543/postgres" | vercel env add DATABASE_URL production

echo "✅ Environment variables updated!"
echo ""
echo "📋 Next steps:"
echo "1. Disable Vercel protection: https://vercel.com/apexs-projects-f6e17e08/pulse/settings/deployment-protection"
echo "2. Test database: npx prisma db push"
echo "3. Seed database: npm run db:seed"

