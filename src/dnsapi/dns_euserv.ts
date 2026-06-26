import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface EuservOptions { email: string; password: string }
export class EuservProvider extends HttpProviderBase {
  readonly id = 'euserv'; readonly name = 'EUserv'
  private readonly auth: string
  constructor(o: EuservOptions) {
    super('https://api.euserv.net')
    if (!o.email || !o.password) throw new DnsProviderError('email and password required', 'euserv')
    this.auth = `Basic ${btoa(`${o.email}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
