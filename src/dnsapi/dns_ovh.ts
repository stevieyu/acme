import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface OvhOptions { appKey: string; appSecret: string; consumerKey: string; consumerSecret: string }
export class OvhProvider extends HttpProviderBase {
  readonly id = 'ovh'; readonly name = 'OVH DNS'
  private readonly appKey: string
  private readonly appSecret: string
  private readonly consumerKey: string
  private readonly consumerSecret: string
  constructor(options: OvhOptions) {
    super('https://eu.api.ovh.com/1.0')
    if (!options.appKey || !options.appSecret || !options.consumerKey || !options.consumerSecret)
      throw new DnsProviderError('appKey, appSecret, consumerKey, consumerSecret required', 'ovh')
    this.appKey = options.appKey
    this.appSecret = options.appSecret
    this.consumerKey = options.consumerKey
    this.consumerSecret = options.consumerSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Ovh-Application': this.appKey } }

  private async ovhRequest(method: string, path: string, body?: unknown): Promise<unknown> {
    const timestamp = Math.floor(Date.now() / 1000)
    const bodyStr = body ? JSON.stringify(body) : ''
    const toSign = `${this.appSecret}+${this.consumerSecret}+${method}+${this.baseUrl}${path}+${bodyStr}+${timestamp}`
    const sigBuf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(toSign))
    const sigBytes = new Uint8Array(sigBuf)
    let hex = ''
    for (const b of sigBytes) hex += b.toString(16).padStart(2, '0')
    const signature = `$1$${hex}`

    const headers: Record<string, string> = {
      'X-Ovh-Application': this.appKey,
      'X-Ovh-Consumer': this.consumerKey,
      'X-Ovh-Signature': signature,
      'X-Ovh-Timestamp': String(timestamp),
    }
    if (body) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${this.baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const data = await response.json()
    if (!response.ok) throw new DnsProviderError(`OVH API: ${JSON.stringify(data)}`, 'ovh')
    return data
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.ovhRequest('POST', `/domain/zone/${domain}/record`, { fieldType: 'TXT', subDomain: sub, target: r.txtvalue, ttl: 300 })
    await this.ovhRequest('POST', `/domain/zone/${domain}/refresh`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const ids = await this.ovhRequest('GET', `/domain/zone/${domain}/record?fieldType=TXT&subDomain=${sub}`) as number[]
      for (const id of ids) {
        const rec = await this.ovhRequest('GET', `/domain/zone/${domain}/record/${id}`) as Record<string, unknown>
        if (rec.target === r.txtvalue) {
          await this.ovhRequest('DELETE', `/domain/zone/${domain}/record/${id}`)
          break
        }
      }
      await this.ovhRequest('POST', `/domain/zone/${domain}/refresh`)
    } catch {}
  }
}
