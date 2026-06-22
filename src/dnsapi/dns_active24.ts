import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface Active24Options { apiKey: string; secret: string }
export class Active24Provider extends HmacProviderBase {
  readonly id = 'active24'; readonly name = 'Active24'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: Active24Options) {
    super('https://api.active24.com')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'active24')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const ts = Date.now().toString()
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), `${method}${url}${ts}`)
    return { 'Authorization': `Active24 ${this.apiKey}:${sig}:${ts}` }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domain/${domain}/web/dns/record`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ hashId: string; content: string }>>('GET', `${this.baseUrl}/domain/${domain}/web/dns/record`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domain/${domain}/web/dns/record/${m.hashId}`)
    } catch {}
  }
}
