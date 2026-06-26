import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface DnsimpleOptions { token: string }
export class DnsimpleProvider extends HttpProviderBase {
  readonly id = 'dnsimple'; readonly name = 'DNSimple'
  private readonly token: string
  constructor(o: DnsimpleOptions) {
    super('https://api.dnsimple.com/v2')
    if (!o.token) throw new DnsProviderError('token required', 'dnsimple')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const accountId = await this.getAccountId()
    await this.request('POST', `${this.baseUrl}/${accountId}/zones/${domain}/records`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = split2(r.fulldomain)
      const accountId = await this.getAccountId()
      const { data } = await this.request<{ data: Array<{ id: number; content: string }> }>('GET', `${this.baseUrl}/${accountId}/zones/${domain}/records`)
      const m = data.data?.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${accountId}/zones/${domain}/records/${m.id}`)
    } catch {}
  }
  private async getAccountId(): Promise<string> {
    const { data } = await this.request<{ data: Array<{ id: number }> }>('GET', `${this.baseUrl}/accounts`)
    return String(data.data?.[0]?.id ?? '0')
  }
}
