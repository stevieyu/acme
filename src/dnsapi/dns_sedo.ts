import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface SedoOptions { apiKey: string }
export class SedoProvider extends HttpProviderBase {
  readonly id = 'sedo'; readonly name = 'Sedo'
  private readonly apiKey: string
  constructor(o: SedoOptions) {
    super('https://api.sedo.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'sedo')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
