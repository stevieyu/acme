import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface SimplyOptions { accountName: string; apiKey: string }
export class SimplyProvider extends HttpProviderBase {
  readonly id = 'simply'; readonly name = 'Simply.com'
  private readonly accountName: string; private readonly apiKey: string
  constructor(o: SimplyOptions) {
    super('https://api.simply.com/1')
    if (!o.accountName || !o.apiKey) throw new DnsProviderError('accountName and apiKey required', 'simply')
    this.accountName = o.accountName; this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Basic ${btoa(`${this.accountName}:${this.apiKey}`)}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/${this.accountName}/${domain}/dns/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300, priority: 0 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ record_id: number; data: string }> }>('GET', `${this.baseUrl}/${this.accountName}/${domain}/dns/records`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${this.accountName}/${domain}/dns/records/${m.record_id}`)
    } catch {}
  }
}
