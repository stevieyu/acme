import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface NederhostOptions { token: string }
export class NederhostProvider extends HttpProviderBase {
  readonly id = 'nederhost'; readonly name = 'Nederhost'
  private readonly token: string
  constructor(o: NederhostOptions) {
    super('https://api.nederhost.nl/dns/v1')
    if (!o.token) throw new DnsProviderError('token required', 'nederhost')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`, { type: 'TXT', name: sub, values: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}
