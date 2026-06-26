import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface TimewebOptions { token: string }
export class TimewebProvider extends HttpProviderBase {
  readonly id = 'timeweb'; readonly name = 'Timeweb'
  private readonly token: string
  constructor(o: TimewebOptions) {
    super('https://api.timeweb.cloud/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'timeweb')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns-records`, { type: 'TXT', subdomain: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ dns_records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/domains/${domain}/dns-records`)
      const m = data.dns_records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns-records/${m.id}`)
    } catch {}
  }
}
