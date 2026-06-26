import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface SelectelOptions { token: string }
export class SelectelProvider extends HttpProviderBase {
  readonly id = 'selectel'; readonly name = 'Selectel DNS'
  private readonly token: string
  constructor(o: SelectelOptions) {
    super('https://api.selectel.ru/domains/v1')
    if (!o.token) throw new DnsProviderError('token required', 'selectel')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Token': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.request('POST', `${this.baseUrl}/${zoneId}/records/`, { name: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = split2(r.fulldomain)
      const zoneId = await this.findZoneId(domain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/${zoneId}/records/`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', this.baseUrl)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'selectel')
  }
}
