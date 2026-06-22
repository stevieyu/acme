import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface VariomediaOptions { token: string }
export class VariomediaProvider extends HttpProviderBase {
  readonly id = 'variomedia'; readonly name = 'Variomedia'
  private readonly token: string
  constructor(o: VariomediaOptions) {
    super('https://api.variomedia.de/dns')
    if (!o.token) throw new DnsProviderError('token required', 'variomedia')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `token ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/records`, { data: { type: 'dns-record', attributes: { record_type: 'TXT', name: sub, data: r.txtvalue, ttl: 300, zone_id: domain } } })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ data: Array<{ id: string; attributes: { data: string } }> }>('GET', `${this.baseUrl}/records?zone=${domain}&type=TXT`)
      const list = data.data ?? []
      const m = list.find((x: { attributes: { data: string } }) => x.attributes.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/records/${m.id}`)
    } catch {}
  }
}
