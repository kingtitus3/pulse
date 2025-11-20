import type { Metadata } from 'next'
import './globals.css'
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider'

export const metadata: Metadata = {
  title: 'Pulse',
  description: 'Anonymous-first, room-centric chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  )
}

