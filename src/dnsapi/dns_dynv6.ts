import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface Dynv6Options { token: string }
export class Dynv6Provider extends HttpProviderBase {
  readonly id = 'dynv6'; readonly name = 'dynv6'
  private readonly token: string
  constructor(o: Dynv6Options) {
    super('https://dynv6.com/api')
    if (!o.token) throw new DnsProviderError('token required', 'dynv6')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v2/zones/${zoneId}/records`, { type: 'TXT', name: r.fulldomain, data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; data: string }>>('GET', `${this.baseUrl}/v2/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/v2/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/v2/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'dynv6')
  }
}
