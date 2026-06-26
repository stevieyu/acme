import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface EasydnsOptions { token: string; key: string }
export class EasydnsProvider extends HttpProviderBase {
  readonly id = 'easydns'; readonly name = 'easyDNS'
  private readonly auth: string
  constructor(o: EasydnsOptions) {
    super('https://rest.easydns.net')
    if (!o.token || !o.key) throw new DnsProviderError('token and key required', 'easydns')
    this.auth = `Basic ${btoa(`${o.token}:${o.key}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/zones/records/all/${domain}`, { host: sub, type: 'TXT', rdata: r.txtvalue, ttl: 300, prio: 0 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/records/all/${domain}/TXT`) } catch {}
  }
}
