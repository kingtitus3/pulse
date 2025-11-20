'use client'

import React, { useCallback, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import { useMeStore } from '@/store/useMeStore'

interface ConnectWalletButtonProps {
  className?: string
}

export default function ConnectWalletButton({
  className = '',
}: ConnectWalletButtonProps) {
  const { publicKey, connected, connect, signMessage } = useWallet()
  const { setMe } = useMeStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(async () => {
    setError(null)

    try {
      if (!connected || !publicKey) {
        setLoading(true)
        await connect()
      }

      if (!publicKey) {
        throw new Error('Wallet not connected')
      }

      if (!signMessage) {
        throw new Error('This wallet does not support message signing')
      }

      const address = publicKey.toBase58()

      // Get challenge message
      let res = await fetch('/api/auth/solana/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get challenge')
      }

      const { message } = await res.json()
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid challenge message')
      }

      const encodedMessage = new TextEncoder().encode(message)
      const signatureBytes = await signMessage(encodedMessage)
      const signature = bs58.encode(signatureBytes)

      // Verify on server and create/link account
      res = await fetch('/api/auth/solana/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          message,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to verify wallet')
      }

      const data = await res.json()
      if (!data.user) {
        throw new Error('Invalid response from server')
      }

      setMe({
        user: data.user,
        wallets: data.wallets || [],
      })
    } catch (err: any) {
      console.error('[ConnectWalletButton] Failed to connect wallet:', err)
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }, [connect, connected, publicKey, signMessage, setMe])

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-1.5 bg-[#0066CC] text-white border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#000000] border-b-[#000000] text-xs sm:text-xs font-bold hover:bg-[#0052A3] active:bg-[#003366] active:border-t-[#000000] active:border-l-[#000000] active:border-r-[#FFFFFF] active:border-b-[#FFFFFF] disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
      >
        {loading ? 'Connecting...' : 'Connect Solana Wallet'}
      </button>
      {error && (
        <div className="mt-1 text-[10px] text-red-600 max-w-xs break-words">
          {error}
        </div>
      )}
    </div>
  )
}



