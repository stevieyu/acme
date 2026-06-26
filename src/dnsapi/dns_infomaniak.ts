import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface InfomaniakOptions { token: string }
export class InfomaniakProvider extends HttpProviderBase {
  readonly id = 'infomaniak'; readonly name = 'Infomaniak'
  private readonly token: string
  constructor(o: InfomaniakOptions) {
    super('https://api.infomaniak.com/1')
    if (!o.token) throw new DnsProviderError('token required', 'infomaniak')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const source = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/domain/${zoneId}/dns/record`, { type: 'TXT', source, target: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: number; target: string; type: string }> }>('GET', `${this.baseUrl}/domain/${zoneId}/dns/records`)
      const records = data.data ?? []
      const m = records.find((x: { target: string; type: string }) => x.type === 'TXT' && x.target === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domain/${zoneId}/dns/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number; customer_name: string }> }>('GET', `${this.baseUrl}/domain`)
    const zones = data.data ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.customer_name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'infomaniak')
  }
}
