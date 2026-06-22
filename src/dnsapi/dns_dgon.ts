import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface DgonOptions { token: string }
export class DgonProvider extends HttpProviderBase {
  readonly id = 'dgon'; readonly name = 'DigitalOcean'
  private readonly token: string
  constructor(options: DgonOptions) {
    super('https://api.digitalocean.com/v2')
    if (!options.token) throw new DnsProviderError('token required', 'dgon')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ domain_records: Array<{ id: number; name: string; data: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.domain_records?.find((x: { name: string; data: string }) => x.name === sub && x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}
