import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface BunnyOptions { apiKey: string }
export class BunnyProvider extends HttpProviderBase {
  readonly id = 'bunny'; readonly name = 'Bunny.net DNS'
  private readonly apiKey: string
  constructor(o: BunnyOptions) {
    super('https://api.bunny.net')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'bunny')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'AccessKey': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('PUT', `${this.baseUrl}/dnszone/${zoneId}/records`, { Type: 3, Name: name, Value: r.txtvalue, Ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ Records: Array<{ Id: number; Value: string; Type: number }> }>('GET', `${this.baseUrl}/dnszone/${zoneId}`)
      const m = data.Records?.find((x: { Value: string; Type: number }) => x.Type === 3 && x.Value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dnszone/${zoneId}/records/${m.Id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ Items: Array<{ Id: number; Domain: string }> }>('GET', `${this.baseUrl}/dnszone`)
    const zones = data.Items ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.Domain === c)
      if (m) return String(m.Id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'bunny')
  }
}
