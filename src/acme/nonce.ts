import type { Logger } from '../util/index.ts'

export class NoncePool {
  private pool: string[] = []
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  push(nonce: string | null | undefined): void {
    if (nonce) {
      this.pool.push(nonce)
      this.logger.debug(`nonce pool size: ${this.pool.length}`)
    }
  }

  async pop(fetchNewNonce: () => Promise<string>): Promise<string> {
    const nonce = this.pool.pop()
    if (nonce) return nonce
    this.logger.debug('nonce pool empty, fetching new nonce')
    return fetchNewNonce()
  }

  get size(): number {
    return this.pool.length
  }
}
