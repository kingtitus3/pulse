-- Complete Setup SQL for Supabase Dashboard
-- Run this in: https://supabase.com/dashboard/project/trmaoahftumgjoufbcqk/sql/new

-- 1. Enable Realtime for messages table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Message') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";
    RAISE NOTICE 'Realtime enabled for Message table';
  ELSE
    RAISE NOTICE 'Message table does not exist yet - will enable Realtime after schema is created';
  END IF;
END $$;

-- 2. Seed System User
INSERT INTO "User" (id, "displayName", avatar, "isAnonymous", role, "createdAt")
VALUES (
  'system',
  'System',
  'system',
  false,
  'admin',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Core Rooms
INSERT INTO "Room" (id, slug, type, "shortName", title, category, description, tags, nsfw, "slowModeSeconds", "isFeatured", archived, "activityScore", "createdAt")
VALUES
  (
    'room-markets',
    'markets',
    'core',
    'Markets',
    'Markets',
    'trading',
    'Charts, trading, and market discussion',
    ARRAY['trading', 'charts', 'markets'],
    false,
    0,
    true,
    false,
    100,
    NOW()
  ),
  (
    'room-memes',
    'memes',
    'core',
    'Memes',
    'Memes',
    'entertainment',
    'Memes and screenshots',
    ARRAY['memes', 'funny'],
    false,
    0,
    true,
    false,
    90,
    NOW()
  ),
  (
    'room-builders',
    'builders',
    'core',
    'Builders',
    'Builders',
    'development',
    'Development and building',
    ARRAY['dev', 'building'],
    false,
    0,
    true,
    false,
    80,
    NOW()
  ),
  (
    'room-help',
    'help',
    'core',
    'Help',
    'Help',
    'support',
    'Support and questions',
    ARRAY['help', 'support'],
    false,
    0,
    true,
    false,
    70,
    NOW()
  ),
  (
    'room-irl',
    'irl',
    'core',
    'IRL',
    'IRL',
    'lifestyle',
    'Life outside crypto',
    ARRAY['life', 'irl'],
    false,
    0,
    true,
    false,
    60,
    NOW()
  ),
  (
    'room-general',
    'general',
    'core',
    'General',
    'General',
    'general',
    'Main lobby',
    ARRAY['general'],
    false,
    0,
    true,
    false,
    50,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Verify setup
SELECT 
  'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 
  'Rooms', COUNT(*) FROM "Room"
UNION ALL
SELECT 
  'Realtime enabled', 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'Message'
  ) THEN 1 ELSE 0 END;

