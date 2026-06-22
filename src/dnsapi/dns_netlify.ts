import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface NetlifyOptions { token: string }
export class NetlifyProvider extends HttpProviderBase {
  readonly id = 'netlify'; readonly name = 'Netlify DNS'
  private readonly token: string
  constructor(o: NetlifyOptions) {
    super('https://api.netlify.com/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'netlify')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const hostname = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/dns_zones/${zoneId}/dns_records`, { type: 'TXT', hostname, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; value: string; type: string }>>('GET', `${this.baseUrl}/dns_zones/${zoneId}/dns_records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { value: string; type: string }) => x.type === 'TXT' && x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns_zones/${zoneId}/dns_records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/dns_zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'netlify')
  }
}
