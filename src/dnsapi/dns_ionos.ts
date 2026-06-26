import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface IonosOptions { apiKey: string }
export class IonosProvider extends HttpProviderBase {
  readonly id = 'ionos'; readonly name = 'IONOS'
  private readonly apiKey: string
  constructor(options: IonosOptions) {
    super('https://api.hosting.ionos.com/dns')
    if (!options.apiKey) throw new DnsProviderError('apiKey required', 'ionos')
    this.apiKey = options.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v1/zones/${zoneId}/records`, { type: 'TXT', name: r.fulldomain, content: r.txtvalue, ttl: 300, disabled: false })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; name: string; content: string }>>('GET', `${this.baseUrl}/v1/zones/${zoneId}`)
      const records = Array.isArray(data) ? data : []
      const m = records.find((x: { name: string; content: string }) => x.name === r.fulldomain && x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/v1/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/v1/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find((z: { name: string }) => z.name === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'ionos')
  }
}
