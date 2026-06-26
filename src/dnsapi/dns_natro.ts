import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface NatroOptions { apiKey: string; apiSecret: string }
export class NatroProvider extends HttpProviderBase {
  readonly id = 'natro'; readonly name = 'Natro DNS'
  private readonly apiKey: string; private readonly apiSecret: string
  constructor(o: NatroOptions) {
    super('https://api.natro.com/v1')
    if (!o.apiKey || !o.apiSecret) throw new DnsProviderError('apiKey and apiSecret required', 'natro')
    this.apiKey = o.apiKey; this.apiSecret = o.apiSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `${this.apiKey}:${this.apiSecret}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
