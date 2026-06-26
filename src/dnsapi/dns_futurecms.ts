import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface FuturecmsOptions { apiKey: string }
export class FuturecmsProvider extends HttpProviderBase {
  readonly id = 'futurecms'; readonly name = 'FutureCMS'
  private readonly apiKey: string
  constructor(o: FuturecmsOptions) {
    super('https://api.futurecms.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'futurecms')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}
