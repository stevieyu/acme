import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface ServercowOptions { username: string; password: string }
export class ServercowProvider extends HttpProviderBase {
  readonly id = 'servercow'; readonly name = 'Servercow'
  private readonly auth: string
  constructor(o: ServercowOptions) {
    super('https://api.servercow.de/dns/v1')
    if (!o.username || !o.password) throw new DnsProviderError('username and password required', 'servercow')
    this.auth = `Basic ${btoa(`${o.username}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}
