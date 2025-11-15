import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface RateLimitOptions {
  limit: number
  windowSeconds: number
}

/**
 * Check rate limit for a given key
 * Returns { ok: true } if within limit, { ok: false } if exceeded
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ ok: boolean }> {
  const { limit, windowSeconds } = options

  try {
    const now = new Date()
    const windowStart = new Date(
      Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000
    )

    // Upsert rate limit record
    const rateLimit = await prisma.rateLimit.upsert({
      where: {
        key_windowStart: {
          key,
          windowStart,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        key,
        windowStart,
        count: 1,
      },
    })

    if (rateLimit.count > limit) {
      return { ok: false }
    }

    return { ok: true }
  } catch (error) {
    // Fail-open: log error but allow request
    console.error('Rate limit check failed:', error)
    return { ok: true }
  }
}

