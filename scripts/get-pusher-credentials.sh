#!/bin/bash

# Guide to get Pusher credentials and add them to Vercel

echo "🚀 Getting Pusher Credentials"
echo ""
echo "Step 1: Open Pusher Dashboard"
echo "   https://dashboard.pusher.com"
echo ""
echo "Step 2: Sign up or log in"
echo ""
echo "Step 3: Create a new app:"
echo "   - Click 'Create app'"
echo "   - Name: 'Pulse' or 'PulseChat'"
echo "   - Choose cluster (e.g., us2, eu, ap-southeast-1)"
echo "   - Click 'Create app'"
echo ""
echo "Step 4: Copy your credentials from the app dashboard"
echo ""
read -p "Press Enter when you have your credentials ready..."

echo ""
echo "Enter your Pusher credentials:"
echo ""

read -p "App ID: " APP_ID
read -p "Key: " KEY
read -p "Secret: " SECRET
read -p "Cluster (e.g., us2): " CLUSTER

echo ""
echo "Removing old variables (if they exist)..."
vercel env rm PUSHER_APP_ID production --yes 2>/dev/null || true
vercel env rm PUSHER_KEY production --yes 2>/dev/null || true
vercel env rm PUSHER_SECRET production --yes 2>/dev/null || true
vercel env rm PUSHER_CLUSTER production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_PUSHER_KEY production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_PUSHER_CLUSTER production --yes 2>/dev/null || true

echo ""
echo "Adding new credentials to Vercel..."

echo "$APP_ID" | vercel env add PUSHER_APP_ID production
echo "$KEY" | vercel env add PUSHER_KEY production
echo "$SECRET" | vercel env add PUSHER_SECRET production
echo "$CLUSTER" | vercel env add PUSHER_CLUSTER production
echo "$KEY" | vercel env add NEXT_PUBLIC_PUSHER_KEY production
echo "$CLUSTER" | vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production

echo ""
echo "✅ Credentials added to Vercel!"
echo ""
echo "Redeploying..."
vercel --prod

echo ""
echo "✅ Done! Your app now has instant messaging via Pusher!"

