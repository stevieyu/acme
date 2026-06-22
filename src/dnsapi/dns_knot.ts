import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface KnotOptions { url: string; token: string }
export class KnotProvider extends HttpProviderBase {
  readonly id = 'knot'; readonly name = 'Knot DNS'
  private readonly token: string
  constructor(o: KnotOptions) {
    super(o.url || 'http://localhost:8080')
    if (!o.url || !o.token) throw new DnsProviderError('url and token required', 'knot')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`, { rrdata: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/${r.fulldomain}/TXT`) } catch {}
  }
}
