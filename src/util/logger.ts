export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface Logger {
  debug(msg: string, ...args: unknown[]): void
  info(msg: string, ...args: unknown[]): void
  warn(msg: string, ...args: unknown[]): void
  error(msg: string, ...args: unknown[]): void
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 }

export function createLogger(level: LogLevel | Logger = 'info'): Logger {
  if (typeof level !== 'string') return level
  const threshold = LEVELS[level]
  return {
    debug: (msg, ...args) => { if (threshold <= 0) console.debug(`[acme] ${msg}`, ...args) },
    info: (msg, ...args) => { if (threshold <= 1) console.info(`[acme] ${msg}`, ...args) },
    warn: (msg, ...args) => { if (threshold <= 2) console.warn(`[acme] ${msg}`, ...args) },
    error: (msg, ...args) => { if (threshold <= 3) console.error(`[acme] ${msg}`, ...args) },
  }
}
