import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface KinghostOptions { apiKey: string }
export class KinghostProvider extends HttpProviderBase {
  readonly id = 'kinghost'; readonly name = 'KingHost'
  private readonly apiKey: string
  constructor(o: KinghostOptions) {
    super('https://api.kinghost.net')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'kinghost')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
