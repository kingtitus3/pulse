-- Ensure each wallet address can only ever be linked to a single user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Wallet_address_unique'
  ) THEN
    ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_address_unique" UNIQUE ("address");
  END IF;
END $$;


