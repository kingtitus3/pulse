# Quick Pusher Setup Guide

## Option 1: Manual Setup (Fastest - 2 minutes)

1. **Sign up for Pusher** (free):
   - Go to https://pusher.com
   - Click "Sign Up" (free account)
   - Verify your email

2. **Create a new app**:
   - Go to https://dashboard.pusher.com
   - Click "Create app"
   - Name it "Pulse" or "PulseChat"
   - Choose a cluster closest to you (e.g., `us2`, `eu`, `ap-southeast-1`)
   - Click "Create app"

3. **Get your credentials**:
   - You'll see:
     - **App ID**: `123456`
     - **Key**: `abc123def456`
     - **Secret**: `xyz789secret`
     - **Cluster**: `us2`

4. **Add to Vercel**:
   ```bash
   vercel env add PUSHER_APP_ID
   # Paste your App ID
   
   vercel env add PUSHER_KEY
   # Paste your Key
   
   vercel env add PUSHER_SECRET
   # Paste your Secret
   
   vercel env add PUSHER_CLUSTER
   # Paste your Cluster (e.g., us2)
   
   vercel env add NEXT_PUBLIC_PUSHER_KEY
   # Paste your Key again (same as PUSHER_KEY)
   
   vercel env add NEXT_PUBLIC_PUSHER_CLUSTER
   # Paste your Cluster again (same as PUSHER_CLUSTER)
   ```

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Option 2: Using Pusher CLI

1. **Install Pusher CLI**:
   ```bash
   brew tap pusher/brew
   brew install pusher/brew/pusher
   ```

2. **Login**:
   ```bash
   pusher login
   ```

3. **List your apps**:
   ```bash
   pusher apps list
   ```

4. **Get app details**:
   ```bash
   pusher apps show <app-id>
   ```

5. **Add credentials to Vercel** (same as Option 1, step 4)

## Verify It's Working

1. Open your chat app
2. Open browser console (F12)
3. Look for: `[PUSHER] ✅ Successfully subscribed to room: ...`
4. Send a message - it should appear instantly!

## Free Tier Limits

- ✅ 200,000 messages/day
- ✅ 100 concurrent connections
- ✅ Unlimited channels
- ✅ Perfect for chat apps!

## Troubleshooting

**"Pusher client not initialized"**:
- Check that `NEXT_PUBLIC_PUSHER_KEY` and `NEXT_PUBLIC_PUSHER_CLUSTER` are set in Vercel
- Redeploy after adding env vars

**"Failed to broadcast message"**:
- Check that `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, and `PUSHER_CLUSTER` are set
- Verify credentials match your Pusher dashboard

**Messages not appearing instantly**:
- Check browser console for Pusher connection errors
- Verify WebSocket connections are allowed (CSP is already configured)

