import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface ZoneOptions { apiKey: string }
export class ZoneProvider extends HttpProviderBase {
  readonly id = 'zone'; readonly name = 'Zone.eu'
  private readonly apiKey: string
  constructor(o: ZoneOptions) {
    super('https://api.zone.eu/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zone')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords`, { hostname: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; value: string }>>('GET', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dnszones/${domain}/dnstxtrecords/${m.id}`)
    } catch {}
  }
}
