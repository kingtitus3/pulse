-- Enable Realtime for Message table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Message') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";
  END IF;
END $$;

