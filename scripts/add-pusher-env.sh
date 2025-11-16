#!/bin/bash

# Add Pusher environment variables to Vercel
# Usage: ./scripts/add-pusher-env.sh

echo "🚀 Adding Pusher environment variables to Vercel"
echo ""
echo "You'll need your Pusher credentials from: https://dashboard.pusher.com"
echo ""

read -p "Enter PUSHER_APP_ID: " APP_ID
read -p "Enter PUSHER_KEY: " KEY
read -p "Enter PUSHER_SECRET: " SECRET
read -p "Enter PUSHER_CLUSTER (e.g., us2): " CLUSTER

echo ""
echo "Adding environment variables..."

echo "$APP_ID" | vercel env add PUSHER_APP_ID production
echo "$KEY" | vercel env add PUSHER_KEY production
echo "$SECRET" | vercel env add PUSHER_SECRET production
echo "$CLUSTER" | vercel env add PUSHER_CLUSTER production
echo "$KEY" | vercel env add NEXT_PUBLIC_PUSHER_KEY production
echo "$CLUSTER" | vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production

echo ""
echo "✅ All environment variables added!"
echo ""
echo "Now redeploy:"
echo "  vercel --prod"

