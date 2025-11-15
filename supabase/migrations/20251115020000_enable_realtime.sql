-- Enable Realtime for Message table (if not already enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Message') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'Message'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public."Message";
    END IF;
  END IF;
END $$;

