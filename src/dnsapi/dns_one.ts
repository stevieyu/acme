import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface OnecomOptions { token: string }
export class OnecomProvider extends HttpProviderBase {
  readonly id = 'one'; readonly name = 'One.com'
  private readonly token: string
  constructor(o: OnecomOptions) {
    super('https://www.one.com/admin/api')
    if (!o.token) throw new DnsProviderError('token required', 'one')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns/custom_records`, { type: 'TXT', prefix: sub, priority: 0, ttl: 3600, data: r.txtvalue })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ result: { records: Array<{ id: string; data: string }> } }>('GET', `${this.baseUrl}/domains/${domain}/dns/custom_records`)
      const records = data.result?.records ?? []
      const m = records.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns/custom_records/${m.id}`)
    } catch {}
  }
}
