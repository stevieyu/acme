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

  // acme.sh L2238: _send_signed_request() — sign and send JWS with automatic nonce retry
  async _send_signed_request<T>(
    url: string,
    buildJws: (nonce: string) => Promise<FlattenedJws>,
  ): Promise<AcmeHttpResponse<T>> {
    return this._sendWithRetry<T>(url, buildJws, (response: Response) => response.json() as Promise<T>)
  }

  // acme.sh L5538: download certificate (or other text response) via POST-as-GET
  async _sendSignedRequestText(
    url: string,
    buildJws: (nonce: string) => Promise<FlattenedJws>,
    acceptHeader?: string,
  ): Promise<AcmeHttpResponse<string>> {
    const extraHeaders: Record<string, string> = {}
    if (acceptHeader) extraHeaders['Accept'] = acceptHeader
    return this._sendWithRetry<string>(
      url, buildJws, (response: Response) => response.text(), extraHeaders,
    )
  }

  // ponytail: single retry on badNonce with re-sign. Shared by JSON and text variants.
  private async _sendWithRetry<T>(
    url: string,
    buildJws: (nonce: string) => Promise<FlattenedJws>,
    parse: (response: Response) => Promise<T>,
    extraHeaders?: Record<string, string>,
  ): Promise<AcmeHttpResponse<T>> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const nonce = await this.noncePool.pop(() => this._getNonce())
      const jws = await buildJws(nonce)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/jose+json', ...extraHeaders },
        body: JSON.stringify(jws),
      })

      this.noncePool.push(response.headers.get('replay-nonce'))

      if (response.ok) {
        const data = await parse(response)
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
