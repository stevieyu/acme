import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface HetznercloudOptions { token: string }
export class HetznercloudProvider extends HttpProviderBase {
  readonly id = 'hetznercloud'; readonly name = 'Hetzner Cloud DNS'
  private readonly token: string
  constructor(o: HetznercloudOptions) {
    super('https://dns.hetzner.com/api/v1')
    if (!o.token) throw new DnsProviderError('token required', 'hetznercloud')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Auth-Token': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1))
    await this.request('POST', `${this.baseUrl}/records`, { type: 'TXT', name, value: r.txtvalue, ttl: 60, zone_id: zoneId })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/records?zone_id=${zoneId}`)
      const m = data.records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      try {
        const { data } = await this.request<{ zones: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/zones?name=${encodeURIComponent(c)}`)
        if (data.zones?.length) return data.zones[0]!.id
      } catch {}
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'hetznercloud')
  }
}
