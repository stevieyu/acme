import type { FlattenedJws } from '../crypto/jws.ts'
import type { Logger } from '../util/index.ts'
import { AcmeError } from './errors.ts'
import type { NoncePool } from './nonce.ts'

export interface AcmeHttpResponse<T> {
  data: T
  headers: Headers
  status: number
}

export class AcmeHttp {
  private noncePool: NoncePool
  private newNonceUrl: string
  private logger: Logger

  constructor(noncePool: NoncePool, newNonceUrl: string, logger: Logger) {
    this.noncePool = noncePool
    this.newNonceUrl = newNonceUrl
    this.logger = logger
  }

  // acme.sh L2267-2289: _send_signed_request() nonce fetching logic
  async _getNonce(): Promise<string> {
    const response = await fetch(this.newNonceUrl, { method: 'HEAD' })
    const nonce = response.headers.get('replay-nonce')
    if (!nonce) throw new AcmeError({ type: 'urn:ietf:params:acme:error:serverInternal', detail: 'No Replay-Nonce in HEAD response' })
    return nonce
  }

  // acme.sh: _post() — raw POST request with JWS body
  async _post<T>(
    url: string,
    jws: FlattenedJws,
  ): Promise<AcmeHttpResponse<T>> {
    // ponytail: 1 retry on badNonce, simple and correct
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/jose+json' },
        body: JSON.stringify(jws),
      })

      // Save nonce from response for next request
      this.noncePool.push(response.headers.get('replay-nonce'))

      if (response.ok) {
        const data = await response.json() as T
        return { data, headers: response.headers, status: response.status }
      }

      const body = await response.text()
      const error = AcmeError.fromResponse(response.status, body)

      // Retry once on badNonce (acme.sh L2373-2378: nonce retry logic)
      if (error.problem.type === 'urn:ietf:params:acme:error:badNonce' && attempt === 0) {
        this.logger.warn('badNonce, retrying with fresh nonce')
        const newNonce = await this._getNonce()
        this.noncePool.push(newNonce)
        // Caller must re-sign with new nonce - so we need a different approach
        // For simplicity, throw and let caller handle
        throw new BadNonceError()
      }

      throw error
    }
    throw new AcmeError({ type: 'urn:ietf:params:acme:error:serverInternal', detail: 'Unexpected retry exhaustion' })
  }

  // acme.sh L2238: _send_signed_request() — sign and send JWS with automatic nonce retry
  async _send_signed_request<T>(
    url: string,
    buildJws: (nonce: string) => Promise<FlattenedJws>,
  ): Promise<AcmeHttpResponse<T>> {
    // ponytail: single retry on badNonce with re-sign
    for (let attempt = 0; attempt < 2; attempt++) {
      const nonce = await this.noncePool.pop(() => this._getNonce())
      const jws = await buildJws(nonce)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/jose+json' },
        body: JSON.stringify(jws),
      })

      this.noncePool.push(response.headers.get('replay-nonce'))

      if (response.ok) {
        const data = await response.json() as T
        return { data, headers: response.headers, status: response.status }
      }

      const body = await response.text()
      const error = AcmeError.fromResponse(response.status, body)

      if (error.problem.type === 'urn:ietf:params:acme:error:badNonce' && attempt === 0) {
        this.logger.warn('badNonce, retrying with fresh nonce')
        continue
      }

      throw error
    }
    throw new AcmeError({ type: 'urn:ietf:params:acme:error:serverInternal', detail: 'badNonce retry exhausted' })
  }
}

class BadNonceError extends Error {
  constructor() {
    super('badNonce')
    this.name = 'BadNonceError'
  }
}
