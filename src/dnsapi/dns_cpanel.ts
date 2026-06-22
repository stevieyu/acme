import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface CpanelOptions { url: string; user: string; token: string }
export class CpanelProvider extends HttpProviderBase {
  readonly id = 'cpanel'; readonly name = 'cPanel'
  private readonly user: string; private readonly token: string
  constructor(o: CpanelOptions) {
    super(o.url || 'https://localhost:2083')
    if (!o.url || !o.user || !o.token) throw new DnsProviderError('url, user and token required', 'cpanel')
    this.user = o.user; this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `cpanel ${this.user}:${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ cpanel_jsonapi_module: 'ZoneEdit', cpanel_jsonapi_func: 'add_zone_record', domain, name: sub, type: 'TXT', txtdata: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/execute/?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = split2(r.fulldomain)
      const params = new URLSearchParams({ cpanel_jsonapi_module: 'ZoneEdit', cpanel_jsonapi_func: 'remove_zone_record', domain, type: 'TXT', line: '1' })
      await fetch(`${this.baseUrl}/execute/?${params}`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}
