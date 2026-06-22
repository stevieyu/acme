import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface MythicOptions { user: string; password: string }
export class MythicProvider extends HttpProviderBase {
  readonly id = 'mythic'; readonly name = 'Mythic Beasts'
  private readonly auth: string
  constructor(o: MythicOptions) {
    super('https://api.mythic-beasts.com/dns/v2')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'mythic')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`, { records: [{ host: sub, ttl: 300, type: 'TXT', data: r.txtvalue }] })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}
