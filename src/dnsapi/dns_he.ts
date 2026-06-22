import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface HeOptions { user: string; password: string }
export class HeProvider extends HttpProviderBase {
  readonly id = 'he'; readonly name = 'Hurricane Electric'
  private readonly user: string; private readonly password: string
  constructor(o: HeOptions) {
    super('https://dns.he.net')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'he')
    this.user = o.user; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ email: this.user, pass: this.password, account: '', menu: 'edit_zone', Type: 'TXT', hosted_dns_zoneid: '', hosted_dns_recordname: r.fulldomain, hosted_dns_recordcontent: r.txtvalue, ttl: '300' })
    await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ email: this.user, pass: this.password, menu: 'delete_record', hosted_dns_zoneid: '', record_id: '' })
      await fetch(this.baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() })
    } catch {}
  }
}
