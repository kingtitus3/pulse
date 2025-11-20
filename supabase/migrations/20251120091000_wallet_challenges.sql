-- Table for nonce-based wallet login challenges
CREATE TABLE IF NOT EXISTS "WalletChallenge" (
  "id" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),
  CONSTRAINT "WalletChallenge_pkey" PRIMARY KEY ("id")
);

-- Index to quickly look up active challenges for an address + nonce
CREATE INDEX IF NOT EXISTS "WalletChallenge_address_nonce_idx"
  ON "WalletChallenge"("address", "nonce");


