# Quick Start Guide - Supabase + Vercel

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon Key (found in Settings > API)
   - Service Role Key (found in Settings > API - keep this secret!)

### 1.2 Configure Database
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the contents of `scripts/supabase-setup.sql`
3. Run the SQL script

### 1.3 Create Storage Buckets
1. Go to Storage in Supabase Dashboard
2. Create these buckets (all public):
   - `images` - for user image uploads
   - `stickers` - for sticker packs
   - `avatars` - for custom user avatars

### 1.4 Get Database Connection String
1. Go to Settings > Database
2. Copy the "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

## Step 2: Vercel Deployment

### 2.1 Link Project to Vercel
```bash
vercel link
```

### 2.2 Set Environment Variables
You'll need to set these in Vercel Dashboard (Settings > Environment Variables):

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
PULSE_SESSION_SECRET=[generate a random secret]
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
TENOR_API_KEY=[optional]
```

### 2.3 Deploy
```bash
vercel --prod
```

## Step 3: Post-Deployment

### 3.1 Run Database Migrations
After first deployment, you need to run:
```bash
# Connect to your Supabase database and run:
npx prisma db push
npm run db:seed
```

Or use Vercel's CLI:
```bash
vercel env pull .env.local
npx prisma db push
npm run db:seed
```

## Troubleshooting

- **Build fails**: Check all environment variables are set in Vercel
- **Database connection fails**: Verify DATABASE_URL is correct
- **Realtime not working**: Run the SQL from `scripts/supabase-setup.sql`
- **Storage uploads fail**: Check bucket policies in Supabase

