import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface AllinklOptions { user: string; password: string }
export class AllinklProvider extends HttpProviderBase {
  readonly id = 'allinkl'; readonly name = 'All-Inkl'
  private readonly auth: string
  constructor(o: AllinklOptions) {
    super('https://kasapi.kasserver.com/dokumentation')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'allinkl')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
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
