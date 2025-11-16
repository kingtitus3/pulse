import { create } from 'zustand'

export interface Wallet {
  id: string
  address: string
  addressTruncated: string
  label: string | null
  isPrimary: boolean
  resolvedHandle: string | null
  avatarUrl: string | null
}

export interface User {
  id: string
  displayName: string
  avatar: string
  bio: string | null
  tags: string[]
  showWallets: boolean
  role: string
  isAnonymous: boolean
}

type SetMePayload =
  | { user: User; wallets?: Wallet[] }
  | User

interface MeState {
  user: User | null
  wallets: Wallet[]
  isLoading: boolean

  setMe: (data: SetMePayload) => void
  updateUser: (updates: Partial<User>) => void
  addWallet: (wallet: Wallet) => void
  removeWallet: (walletId: string) => void
  updateWallet: (walletId: string, updates: Partial<Wallet>) => void
  setLoading: (loading: boolean) => void
}

export const useMeStore = create<MeState>((set) => ({
  user: null,
  wallets: [],
  isLoading: false,

  setMe: (data) =>
    set(() => {
      // Support both { user, wallets? } and plain User payloads
      if ((data as any).user) {
        const payload = data as { user: User; wallets?: Wallet[] }
        return {
          user: payload.user,
          wallets: payload.wallets ?? [],
        }
      }

      // Plain User
      return {
        user: data as User,
        wallets: [],
      }
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  addWallet: (wallet) =>
    set((state) => ({
      wallets: [...state.wallets, wallet],
    })),

  removeWallet: (walletId) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== walletId),
    })),

  updateWallet: (walletId, updates) =>
    set((state) => ({
      wallets: state.wallets.map((w) =>
        w.id === walletId ? { ...w, ...updates } : w
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}))

