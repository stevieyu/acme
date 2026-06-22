import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface AutodnsOptions { user: string; password: string; context: string }
export class AutodnsProvider extends HttpProviderBase {
  readonly id = 'autodns'; readonly name = 'AutoDNS'
  private readonly user: string; private readonly password: string; private readonly context: string
  constructor(o: AutodnsOptions) {
    super('https://api.autodns.com/v1')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'autodns')
    this.user = o.user; this.password = o.password; this.context = o.context ?? '4'
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Domainrobot-Context': this.context, 'Authorization': `Basic ${btoa(`${this.user}:${this.password}`)}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zone/${domain}`, { origin: domain, resourceRecords: [{ name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 }] })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zone/${domain}/TXT`) } catch {}
  }
}
