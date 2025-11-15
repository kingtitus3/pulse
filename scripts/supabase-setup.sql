-- Supabase Setup SQL Script
-- Run this in your Supabase SQL Editor

-- 1. Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Create Storage Buckets (if they don't exist)
-- Note: Buckets need to be created via the Supabase Dashboard or API
-- This SQL creates the policies for existing buckets

-- Storage policies for 'images' bucket
-- Allow public read access
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads for images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' AND
  auth.role() = 'authenticated'
);

-- Storage policies for 'stickers' bucket
CREATE POLICY "Public read access for stickers"
ON storage.objects FOR SELECT
USING (bucket_id = 'stickers');

-- Storage policies for 'avatars' bucket
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated uploads to avatars
CREATE POLICY "Authenticated uploads for avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Allow users to update/delete their own avatars
CREATE POLICY "Users can update their avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

