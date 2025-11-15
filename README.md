# PulseChat

Anonymous-first, room-centric chat application with optional Solana wallet connect.

## Features

- **Anonymous by default**: No email/password, no OAuth. Session-based authentication.
- **Room-centric**: 6 core rooms + user-created ephemeral topic rooms.
- **User profiles**: Optional profiles with display name, bio, tags, and wallet addresses.
- **Solana wallet connect**: Link wallets (public keys only, never private keys).
- **Stickers, GIFs, Images**: Rich media support with curated sticker packs.
- **Realtime chat**: Powered by Supabase Realtime.
- **Privacy-first**: No PII storage, IP hashing, secure headers.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **State**: Zustand
- **Styling**: Tailwind CSS (XP/MSN theme)
- **Wallet**: @solana/wallet-adapter

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL`: PostgreSQL connection string
   - `PULSE_SESSION_SECRET`: Random secret for session signing
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
   - `TENOR_API_KEY`: (Optional) For GIF search

3. **Set up database**:
   ```bash
   npx prisma db push
   npx prisma generate
   npm run db:seed
   ```

4. **Enable Supabase Realtime**:
   Run this SQL in your Supabase SQL editor:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ```

5. **Set up Supabase Storage**:
   - Create a bucket named `images` for user uploads
   - Create a bucket named `stickers` for sticker packs
   - Configure appropriate policies

6. **Run development server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
/app              # Next.js app router pages
  /api           # API routes
  /app           # Main chat interface
  /u/[id]        # User profile pages
/components      # React components
/lib             # Utility functions
/prisma          # Database schema and migrations
/store           # Zustand stores
/scripts         # Utility scripts (sticker import, etc.)
```

## Core Rooms

1. **Markets** - Charts & trading discussion
2. **Memes** - Memes and screenshots
3. **Builders** - Development and building
4. **Help** - Support and questions
5. **IRL** - Life outside crypto
6. **General** - Main lobby

## TODO

- [ ] Profanity filter implementation
- [ ] Tenor API integration for GIFs
- [ ] Wallet signature verification
- [ ] Activity score cron job for topic rooms
- [ ] Room archiving automation
- [ ] Sticker pack import from storage
- [ ] Advanced moderation tools
- [ ] Slow mode per-user tracking

## Security Notes

- All user input is sanitized
- IP addresses are hashed (not stored raw)
- No private keys or sensitive wallet data stored
- Rate limiting on all user actions
- Security headers on all responses
- Content Security Policy configured

## License

MIT

