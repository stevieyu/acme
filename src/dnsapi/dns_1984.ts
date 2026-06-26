import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface Nineteen84bOptions { token: string }
export class Nineteen84bProvider extends HttpProviderBase {
  readonly id = '1984'; readonly name = '1984'
  private readonly token: string
  constructor(o: Nineteen84bOptions) {
    super('https://api.1984.is/v1')
    if (!o.token) throw new DnsProviderError('token required', '1984')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}
