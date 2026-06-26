import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface DynuOptions { apiKey: string }
export class DynuProvider extends HttpProviderBase {
  readonly id = 'dynu'; readonly name = 'Dynu DNS'
  private readonly apiKey: string
  constructor(o: DynuOptions) {
    super('https://api.dynu.com/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dynu')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/dns/${zoneId}/record`, { recordType: 'TXT', hostname: r.fulldomain, nodeName: name, textData: r.txtvalue, state: true, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ dnsRecords: Array<{ id: number; textData: string }> }>('GET', `${this.baseUrl}/dns/${zoneId}/record`)
      const m = data.dnsRecords?.find((x: { textData: string }) => x.textData === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/${zoneId}/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/dns`)
    const zones = data.domains ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'dynu')
  }
}
