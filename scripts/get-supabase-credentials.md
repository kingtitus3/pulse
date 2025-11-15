# Get Your Supabase Credentials

## Step 1: Get Project Reference
1. Go to your Supabase project dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/[PROJECT-REF]`
3. Copy the `[PROJECT-REF]` (it looks like: `abcdefghijklmnop`)

## Step 2: Get API Keys
1. In your Supabase project, go to **Settings > API**
2. Copy these values:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public key**: (starts with `eyJ...`)
   - **service_role key**: (starts with `eyJ...` - keep this secret!)

## Step 3: Build Your Connection String
Your DATABASE_URL will be:
```
postgresql://postgres:mtTptJ9Tw2WfU4tY@db.[PROJECT-REF].supabase.co:5432/postgres
```

Replace `[PROJECT-REF]` with your actual project reference.

## Step 4: Test Connection
Once you have all credentials, we'll:
1. Set up the database schema
2. Seed initial data
3. Configure storage buckets
4. Deploy to Vercel

