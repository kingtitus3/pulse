#!/bin/bash

# Supabase Setup Script
# This script helps you set up Supabase for Pulse

echo "🚀 Pulse - Supabase Setup"
echo "=========================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    echo ""
    echo "   Or install via npm:"
    echo "   npm install -g supabase"
    echo ""
    read -p "Press Enter to continue with manual setup..."
fi

echo "📋 Supabase Setup Checklist:"
echo ""
echo "1. Create a new Supabase project at https://supabase.com"
echo "2. Get your project credentials:"
echo "   - Project URL (SUPABASE_URL)"
echo "   - Anon Key (SUPABASE_ANON_KEY)"
echo "   - Service Role Key (SUPABASE_SERVICE_ROLE_KEY)"
echo ""
echo "3. In Supabase Dashboard:"
echo "   a. Go to SQL Editor"
echo "   b. Run the SQL from scripts/supabase-setup.sql"
echo ""
echo "4. Go to Storage and create these buckets:"
echo "   - 'images' (public bucket)"
echo "   - 'stickers' (public bucket)"
echo "   - 'avatars' (public bucket)"
echo ""
echo "5. Set environment variables:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

read -p "Have you completed the Supabase setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Great! You can now proceed with deployment."
else
    echo "📝 Please complete the setup steps above, then run this script again."
fi

