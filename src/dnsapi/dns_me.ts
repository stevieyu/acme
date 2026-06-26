import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface MeOptions { apiKey: string; username: string }
export class MeProvider extends HmacProviderBase {
  readonly id = 'me'; readonly name = 'Dynadot ME'
  private readonly apiKey: string
  constructor(options: MeOptions) {
    super('https://api.dynadot.com/api3')
    if (!options.apiKey || !options.username) throw new DnsProviderError('apiKey and username required', 'me')
    this.apiKey = options.apiKey
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> {
    const ts = Math.floor(Date.now() / 1000).toString()
    const sig = await this.hmacSign(new TextEncoder().encode(this.apiKey), ts)
    return { 'X-API-Key': this.apiKey, 'X-API-Signature': sig, 'X-API-Timestamp': ts }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns`, { domain, hostname: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; content: string; hostname: string }> }>('GET', `${this.baseUrl}/dns?domain=${domain}`)
      const m = data.records?.find((x: { content: string; hostname: string }) => x.hostname === sub && x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/${m.id}`)
    } catch {}
  }
}
