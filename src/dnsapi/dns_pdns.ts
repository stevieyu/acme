import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface PowerdnsOptions { url: string; apiKey: string; serverId?: string }
export class PowerdnsProvider extends HttpProviderBase {
  readonly id = 'pdns'; readonly name = 'PowerDNS'
  private readonly apiKey: string; private readonly serverId: string
  constructor(o: PowerdnsOptions) {
    super(o.url || 'http://localhost:8081')
    if (!o.url || !o.apiKey) throw new DnsProviderError('url and apiKey required', 'pdns')
    this.apiKey = o.apiKey; this.serverId = o.serverId ?? 'localhost'
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    const zoneId = await this.fz(domain)
    await this.request('PATCH', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones/${zoneId}`, {
      rrsets: [{ name: `${r.fulldomain}.`, type: 'TXT', changetype: 'REPLACE', ttl: 300, records: [{ content: `"${r.txtvalue}"`, disabled: false }] }],
    })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const zoneId = await this.fz(domain)
      await this.request('PATCH', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones/${zoneId}`, {
        rrsets: [{ name: `${r.fulldomain}.`, type: 'TXT', changetype: 'DELETE' }],
      })
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/api/v1/servers/${this.serverId}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.` || z.name === c); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'pdns')
  }
}
