import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface ExoscaleOptions { apiKey: string; secretKey: string }
export class ExoscaleProvider extends HmacProviderBase {
  readonly id = 'exoscale'; readonly name = 'Exoscale DNS'
  private readonly apiKey: string
  private readonly secretKey: string
  constructor(options: ExoscaleOptions) {
    super('https://api.exoscale.com/dns/v1')
    if (!options.apiKey || !options.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'exoscale')
    this.apiKey = options.apiKey
    this.secretKey = options.secretKey
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const date = new Date().toUTCString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const sig = await this.hmacSign(new TextEncoder().encode(this.secretKey), `${method}\n${path}\n${date}`)
    return { 'X-Auth-ApiKey': this.apiKey, 'X-Auth-Signature': sig, 'X-Auth-Expires': date }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { record: { name: sub, record_type: 'TXT', content: r.txtvalue, ttl: 300 } })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: number; name: string; content: string; record_type: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { name: string; content: string; record_type: string }) => x.name === sub && x.content === r.txtvalue && x.record_type === 'TXT')
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}
