import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface DnsmadeeasyOptions { apiKey: string; secretKey: string }
export class DnsmadeeasyProvider extends HttpProviderBase {
  readonly id = 'dnsmadeeasy'; readonly name = 'DNS Made Easy'
  private readonly apiKey: string
  constructor(o: DnsmadeeasyOptions) {
    super('https://api.dnsmadeeasy.com/V2.0')
    if (!o.apiKey || !o.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'dnsmadeeasy')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> {
    const ts = Date.now().toString()
    return { 'x-dnsme-apiKey': this.apiKey, 'x-dnsme-requestDate': ts }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/dns/managed/${zoneId}/records`, { name, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<{ data: Array<{ id: number; value: string }> }>('GET', `${this.baseUrl}/dns/managed/${zoneId}/records`)
      const m = data.data?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/dns/managed/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/dns/managed`)
    const zones = data.data ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'dnsmadeeasy')
  }
}
