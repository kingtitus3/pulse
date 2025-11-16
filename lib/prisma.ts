import { PrismaClient } from '@prisma/client'

// Singleton pattern for PrismaClient in serverless environments
// Prevents connection pool exhaustion by reusing the same client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Optimize for serverless
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// In development, reuse the same instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// In production (serverless), the instance will be created fresh but
// the singleton pattern ensures only one instance per function invocation

