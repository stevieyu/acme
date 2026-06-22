import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface NamecomOptions { user: string; token: string }
export class NamecomProvider extends HttpProviderBase {
  readonly id = 'namecom'; readonly name = 'Name.com'
  private readonly auth: string
  constructor(o: NamecomOptions) {
    super('https://api.name.com/v4')
    if (!o.user || !o.token) throw new DnsProviderError('user and token required', 'namecom')
    this.auth = `Basic ${btoa(`${o.user}:${o.token}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { host: sub, type: 'TXT', answer: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: number; answer: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records`)
      const m = data.records?.find((x: { answer: string }) => x.answer === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}`)
    } catch {}
  }
}
