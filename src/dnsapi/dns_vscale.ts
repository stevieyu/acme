import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface VscaleOptions { token: string }
export class VscaleProvider extends HttpProviderBase {
  readonly id = 'vscale'; readonly name = 'Vscale'
  private readonly token: string
  constructor(o: VscaleOptions) {
    super('https://api.vscale.io/v1')
    if (!o.token) throw new DnsProviderError('token required', 'vscale')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Token': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}
