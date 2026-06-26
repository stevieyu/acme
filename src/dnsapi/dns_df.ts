import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface DfeuOptions { token: string }
export class DfeuProvider extends HttpProviderBase {
  readonly id = 'df'; readonly name = 'DF.eu'
  private readonly token: string
  constructor(o: DfeuOptions) {
    super('https://api.df.eu/v1')
    if (!o.token) throw new DnsProviderError('token required', 'df')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
