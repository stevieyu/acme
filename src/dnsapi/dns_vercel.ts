import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface VercelOptions { token: string; teamId?: string }
export class VercelProvider extends HttpProviderBase {
  readonly id = 'vercel'; readonly name = 'Vercel DNS'
  private readonly token: string; private readonly teamId: string
  constructor(o: VercelOptions) {
    super('https://api.vercel.com/v2')
    if (!o.token) throw new DnsProviderError('token required', 'vercel')
    this.token = o.token; this.teamId = o.teamId ?? ''
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  private teamQs(): string { return this.teamId ? `?teamId=${this.teamId}` : '' }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records${this.teamQs()}`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>('GET', `${this.baseUrl}/domains/${domain}/records${this.teamQs()}`)
      const m = data.records?.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${m.id}${this.teamQs()}`)
    } catch {}
  }
}
