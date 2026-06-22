import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface LinodeV4Options { token: string }
export class LinodeV4Provider extends HttpProviderBase {
  readonly id = 'linode_v4'; readonly name = 'Linode v4'
  private readonly token: string
  constructor(options: LinodeV4Options) {
    super('https://api.linode.com/v4')
    if (!options.token) throw new DnsProviderError('token required', 'linode_v4')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const sub = r.fulldomain.slice(0, -(domain.length + 1))
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, { type: 'TXT', name: sub, target: r.txtvalue, ttl_sec: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const sub = r.fulldomain.slice(0, -(domain.length + 1))
    try {
      const { data } = await this.request<{ data: Array<{ id: number; name: string; target: string }> }>('GET', `${this.baseUrl}/domains/${zoneId}/records`)
      const m = data.data?.find((x: { name: string; target: string }) => x.name === sub && x.target === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<number> {
    const { data } = await this.request<{ data: Array<{ id: number; domain: string }> }>('GET', `${this.baseUrl}/domains`)
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = data.data?.find((z: { domain: string }) => z.domain === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'linode_v4')
  }
}
