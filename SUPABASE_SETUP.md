# Supabase Configuration Guide

## Quick Setup Steps

### 1. Create Supabase Project
1. Visit https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `pulse` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get Your Credentials
Once project is ready, go to **Settings > API**:

- **Project URL**: `https://[project-ref].supabase.co`
- **anon public key**: Copy this (starts with `eyJ...`)
- **service_role key**: Copy this (keep secret!)

### 3. Enable Realtime
1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Paste this SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

4. Click "Run" (or press Cmd/Ctrl + Enter)

### 4. Create Storage Buckets
1. Go to **Storage** in Supabase Dashboard
2. Click "Create a new bucket"
3. Create these three buckets:

**Bucket 1: `images`**
- Name: `images`
- Public bucket: ✅ **Yes**
- File size limit: 5 MB
- Allowed MIME types: `image/*`

**Bucket 2: `stickers`**
- Name: `stickers`
- Public bucket: ✅ **Yes**
- File size limit: 2 MB
- Allowed MIME types: `image/*`

**Bucket 3: `avatars`**
- Name: `avatars`
- Public bucket: ✅ **Yes**
- File size limit: 2 MB
- Allowed MIME types: `image/*`

### 5. Set Storage Policies
1. Go to **Storage** > **Policies**
2. For each bucket (`images`, `stickers`, `avatars`):
   - Click "New Policy"
   - Select "For full customization"
   - Name: `Public read access`
   - Policy definition:
   ```sql
   (bucket_id = 'images'::text)
   ```
   - Allowed operation: `SELECT`
   - Policy applies to: `All users`

3. For `images` and `avatars` buckets, also add:
   - Name: `Authenticated uploads`
   - Policy definition:
   ```sql
   (bucket_id = 'images'::text AND auth.role() = 'authenticated')
   ```
   - Allowed operation: `INSERT`
   - Policy applies to: `Authenticated users only`

### 6. Get Database Connection String
1. Go to **Settings > Database**
2. Under "Connection string", select "URI"
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. This is your `DATABASE_URL`

### 7. Run Database Setup
After setting up Supabase, you need to:
1. Push Prisma schema to database
2. Seed initial data

```bash
# Set your DATABASE_URL first
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database
npm run db:seed
```

## Environment Variables Summary

You'll need these for Vercel:

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[your-anon-key-from-settings-api]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key-from-settings-api]
PULSE_SESSION_SECRET=[generate-random-secret]
TENOR_API_KEY=[optional-for-gifs]
```

## Generate Session Secret

```bash
# Generate a random secret
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Next Steps

Once Supabase is configured:
1. ✅ Realtime enabled
2. ✅ Storage buckets created
3. ✅ Database schema pushed
4. ✅ Initial data seeded

Proceed to Vercel deployment!

