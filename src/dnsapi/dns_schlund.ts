import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface SchlundOptions { token: string }
export class SchlundProvider extends HttpProviderBase {
  readonly id = 'schlund'; readonly name = 'Schlund'
  private readonly token: string
  constructor(o: SchlundOptions) {
    super('https://api.schlund.de/v1')
    if (!o.token) throw new DnsProviderError('token required', 'schlund')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}
