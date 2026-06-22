import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface NsoneOptions { apiKey: string }
export class NsoneProvider extends HttpProviderBase {
  readonly id = 'nsone'; readonly name = 'NS1'
  private readonly apiKey: string
  constructor(o: NsoneOptions) {
    super('https://api.nsone.net/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'nsone')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-NSONE-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`, { zone: domain, domain: r.fulldomain, type: 'TXT', ttl: 300, answers: [{ rdata: [r.txtvalue] }] })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`) } catch {}
  }
}
