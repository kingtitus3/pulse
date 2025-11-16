#!/bin/bash

# Setup Pusher credentials using CLI or manual input

echo "🚀 Setting up Pusher for Pulse"
echo ""

# Check if Pusher CLI is installed
if command -v pusher &> /dev/null; then
    echo "✅ Pusher CLI found"
    echo ""
    echo "Logging in to Pusher..."
    pusher login
    
    echo ""
    echo "Listing your Pusher apps..."
    pusher apps list
    
    echo ""
    echo "To get your credentials, run:"
    echo "  pusher apps show <app-id>"
    echo ""
    echo "Or visit: https://dashboard.pusher.com"
else
    echo "⚠️  Pusher CLI not installed"
    echo ""
    echo "Install it with:"
    echo "  brew tap pusher/brew"
    echo "  brew install pusher/brew/pusher"
    echo ""
    echo "Or manually get credentials from: https://dashboard.pusher.com"
    echo ""
    echo "Once you have credentials, add them to Vercel:"
    echo "  PUSHER_APP_ID=your_app_id"
    echo "  PUSHER_KEY=your_key"
    echo "  PUSHER_SECRET=your_secret"
    echo "  PUSHER_CLUSTER=us2"
    echo "  NEXT_PUBLIC_PUSHER_KEY=your_key"
    echo "  NEXT_PUBLIC_PUSHER_CLUSTER=us2"
fi

