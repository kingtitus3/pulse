# Pulse Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all environment variables are set in your deployment platform:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/pulsechat?schema=public"

# Session Security (generate a strong random secret)
PULSE_SESSION_SECRET="your-secret-key-here-change-in-production"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Tenor API (optional, for GIF search)
TENOR_API_KEY=""
```

### 2. Database Setup
Run these commands in your production database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed core rooms
npm run db:seed
```

### 3. Supabase Configuration

#### Enable Realtime
Run this SQL in your Supabase SQL editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

#### Create Storage Buckets
1. Go to Storage in Supabase dashboard
2. Create bucket: `images` (public, for user uploads)
3. Create bucket: `stickers` (public, for sticker packs)
4. Create bucket: `avatars` (public, for custom avatars)

#### Set Storage Policies
Configure appropriate policies for each bucket to allow public read and authenticated uploads.

### 4. Build & Deploy

The build is ready! Deploy using your preferred platform:

**Vercel:**
```bash
vercel --prod
```

**Other platforms:**
```bash
npm run build
npm start
```

## Post-Deployment

1. ✅ Verify database connection
2. ✅ Test room creation and messaging
3. ✅ Test image/sticker uploads
4. ✅ Verify Supabase Realtime is working
5. ✅ Check security headers are applied
6. ✅ Test anonymous session creation

## Production Considerations

- **Rate Limiting**: Already implemented in API routes
- **Security Headers**: Configured in `middleware.ts`
- **CSP**: Currently permissive for development - tighten for production
- **Session Secret**: Use a strong, random secret in production
- **Database**: Use connection pooling for production
- **Monitoring**: Set up error logging and monitoring

## Troubleshooting

- **"No rooms available"**: Run `npm run db:seed`
- **Realtime not working**: Verify Supabase Realtime is enabled
- **Image uploads failing**: Check Supabase Storage bucket policies
- **Build errors**: Ensure all environment variables are set

