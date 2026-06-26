import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface ZiloreOptions { apiKey: string }
export class ZiloreProvider extends HttpProviderBase {
  readonly id = 'zilore'; readonly name = 'Zilore DNS'
  private readonly apiKey: string
  constructor(o: ZiloreOptions) {
    super('https://api.zilore.com/dns/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zilore')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/domains/${domain}/records?record_name=${sub}&record_type=TXT&record_value=${encodeURIComponent(r.txtvalue)}&record_ttl=300`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records?record_name=${sub}&record_type=TXT&record_value=${encodeURIComponent(r.txtvalue)}`) } catch {}
  }
}
