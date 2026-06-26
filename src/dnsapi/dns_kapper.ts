import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface KapperOptions { apiKey: string; secret: string }
export class KapperProvider extends HttpProviderBase {
  readonly id = 'kapper'; readonly name = 'Kapper DNS'
  private readonly auth: string
  constructor(o: KapperOptions) {
    super('https://dnspanel.kapper.net/api/1.2')
    if (!o.apiKey || !o.secret) throw new DnsProviderError('apiKey and secret required', 'kapper')
    this.auth = `Basic ${btoa(`${o.apiKey}:${o.secret}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/record`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/record/${sub}/TXT`) } catch {}
  }
}
