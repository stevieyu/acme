import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface Nineteen84Options { user: string; password: string }
export class Nineteen84Provider extends HttpProviderBase {
  readonly id = '1984hosting'; readonly name = '1984 Hosting'
  private cookies = ''
  constructor(o: Nineteen84Options) {
    super('https://1984.hosting/api')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', '1984hosting')
  }
  protected buildAuthHeaders(): Record<string, string> { return this.cookies ? { 'Cookie': this.cookies } : {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/record`, { zone: domain, host: sub, type: 'TXT', rdata: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/record/${domain}/TXT`) } catch {}
  }
}
