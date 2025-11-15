type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

function formatLog(level: LogLevel, msg: string, meta?: LogMeta): string {
  const entry = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...meta,
  }
  return JSON.stringify(entry)
}

function truncateWalletAddress(address: string): string {
  if (address.length <= 8) return address
  return `${address.substring(0, 4)}…${address.substring(address.length - 4)}`
}

function sanitizeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return undefined

  const sanitized: LogMeta = {}
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'walletAddress' && typeof value === 'string') {
      sanitized[key] = truncateWalletAddress(value)
    } else if (key === 'content' || key === 'message') {
      // Never log full message content
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export const logger = {
  info(msg: string, meta?: LogMeta): void {
    console.log(formatLog('info', msg, sanitizeMeta(meta)))
  },

  warn(msg: string, meta?: LogMeta): void {
    console.warn(formatLog('warn', msg, sanitizeMeta(meta)))
  },

  error(msg: string, meta?: LogMeta): void {
    console.error(formatLog('error', msg, sanitizeMeta(meta)))
  },
}

