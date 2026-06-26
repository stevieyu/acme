import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface ArvanOptions { apiKey: string }
export class ArvanProvider extends HttpProviderBase {
  readonly id = 'arvan'; readonly name = 'Arvan Cloud'
  private readonly apiKey: string
  constructor(o: ArvanOptions) {
    super('https://api.arvancloud.ir/cdn/4.0')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'arvan')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Apikey ${this.apiKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/dns-records`, { type: 'TXT', name, value: { text: r.txtvalue }, ttl: 120 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: string; value: Record<string, string> }> }>('GET', `${this.baseUrl}/domains/${zoneId}/dns-records`)
      const m = data.data?.find((x: { value: Record<string, string> }) => x.value.text === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/dns-records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.data ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'arvan')
  }
}
