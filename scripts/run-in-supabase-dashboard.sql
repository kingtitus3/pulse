-- Run this entire script in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/trmaoahftumgjoufbcqk/sql/new

-- This will create all the tables from Prisma schema
-- Then run the seed data and Realtime setup

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Note: The Prisma schema tables will be created when you run:
-- npx prisma db push
-- 
-- Or you can manually create them, but it's easier to use Prisma.
-- 
-- After tables are created, run the seed script:
-- npm run db:seed

