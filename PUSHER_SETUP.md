# Pusher Setup for Instant Messaging

Since Supabase Realtime isn't available on the free tier, we're using Pusher for instant WebSocket messaging.

## Free Tier Limits
- 200,000 messages/day
- 100 concurrent connections
- Unlimited channels
- Perfect for chat applications!

## Setup Steps

1. **Create Pusher Account** (free):
   - Go to https://pusher.com
   - Sign up for free account
   - Create a new app
   - Choose your cluster (e.g., `us2`, `eu`, `ap-southeast-1`)

2. **Get Your Credentials**:
   - App ID
   - Key (public)
   - Secret (private)
   - Cluster (e.g., `us2`)

3. **Set Environment Variables**:

   **In Vercel:**
   ```
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=us2
   
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

   **In local `.env`:**
   ```
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=us2
   
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## How It Works

1. User sends message → Saved to database
2. API broadcasts message via Pusher → `pusherServer.trigger('room-{id}', 'new-message', message)`
3. All clients subscribed to that room receive it instantly via WebSocket
4. Message appears immediately! ⚡

## Benefits

- ✅ **Instant messaging** - True WebSocket real-time
- ✅ **Free tier** - 200k messages/day (plenty for most apps)
- ✅ **Reliable** - Built for production
- ✅ **Scalable** - Handles thousands of concurrent users
- ✅ **No database replication needed** - Works with any database

