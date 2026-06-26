import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface ConohaOptions { token: string; region: string }
export class ConohaProvider extends HttpProviderBase {
  readonly id = 'conoha'; readonly name = 'ConoHa'
  private readonly token: string
  constructor(o: ConohaOptions) {
    super(`https://dns-service.${o.region || 'tyo1'}.conoha.io/v1`)
    if (!o.token) throw new DnsProviderError('token required', 'conoha')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, { name: `${r.fulldomain}.`, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ records: Array<{ id: string; data: string }> }>('GET', `${this.baseUrl}/domains/${zoneId}/records`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.domains ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.`); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'conoha')
  }
}
