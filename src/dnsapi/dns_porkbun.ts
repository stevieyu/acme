import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface PorkbunOptions { apiKey: string; secretKey: string }
export class PorkbunProvider extends HttpProviderBase {
  readonly id = 'porkbun'; readonly name = 'Porkbun'
  private readonly apiKey: string; private readonly secretKey: string
  constructor(o: PorkbunOptions) {
    super('https://api.porkbun.com/api/json/v3')
    if (!o.apiKey || !o.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'porkbun')
    this.apiKey = o.apiKey; this.secretKey = o.secretKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private pbBody(): Record<string, string> { return { secretapikey: this.secretKey, apikey: this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/create/${domain}`, { ...this.pbBody(), subdomain: sub, type: 'TXT', content: r.txtvalue, ttl: '300' })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; content: string; type: string }> }>('POST', `${this.baseUrl}/dns/retrieve/${domain}`, this.pbBody())
      const m = data.records?.find((x: { content: string; type: string }) => x.type === 'TXT' && x.content === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete/${domain}/${m.id}`, this.pbBody())
    } catch {}
  }
}
