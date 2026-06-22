import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface GcoreOptions { token: string }
export class GcoreProvider extends HttpProviderBase {
  readonly id = 'gcore'; readonly name = 'G-Core DNS'
  private readonly token: string
  constructor(options: GcoreOptions) {
    super('https://api.gcore.com/dns')
    if (!options.token) throw new DnsProviderError('token required', 'gcore')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `APIKey ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/v2/zones/${domain}/records`, { type: 'TXT', name: sub, content: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/v2/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}
