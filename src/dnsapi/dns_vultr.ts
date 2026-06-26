import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface VultrOptions { token: string }
export class VultrProvider extends HttpProviderBase {
  readonly id = 'vultr'; readonly name = 'Vultr'
  private readonly token: string
  constructor(options: VultrOptions) {
    super('https://api.vultr.com/v2')
    if (!options.token) throw new DnsProviderError('token required', 'vultr')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; name: string; data: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { name: string; data: string }) => x.name === sub && x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}
