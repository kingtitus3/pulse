import bs58 from 'bs58'
import { PublicKey } from '@solana/web3.js'

/**
 * Validate Solana public key format (base58)
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Try to decode as base58
    const decoded = bs58.decode(address)
    
    // Solana public keys are 32 bytes
    if (decoded.length !== 32) {
      return false
    }

    // Try to create PublicKey instance
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string, start = 4, end = 4): string {
  if (address.length <= start + end) {
    return address
  }
  return `${address.substring(0, start)}…${address.substring(address.length - end)}`
}

/**
 * TODO: Verify wallet ownership via signed message
 * This would require:
 * 1. Generate a nonce
 * 2. User signs message with wallet
 * 3. Verify signature on server
 */
export async function verifyWalletOwnership(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    if (!isValidSolanaAddress(address)) {
      return false
    }

    const publicKey = new PublicKey(address)

    // Signature is expected to be base58-encoded
    const signatureBytes = bs58.decode(signature)
    const messageBytes = new TextEncoder().encode(message)

    return publicKey.verify(messageBytes, signatureBytes)
  } catch {
    return false
  }
}

