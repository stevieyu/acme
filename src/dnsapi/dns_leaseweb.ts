import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface LeasewebOptions { apiKey: string }
export class LeasewebProvider extends HttpProviderBase {
  readonly id = 'leaseweb'; readonly name = 'Leaseweb DNS'
  private readonly apiKey: string
  constructor(o: LeasewebOptions) {
    super('https://api.leaseweb.com/hosting/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'leaseweb')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-LSW-Auth': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/resourceRecordSets`, { name: sub, type: 'TXT', content: [r.txtvalue], ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/resourceRecordSets/${sub}/TXT`) } catch {}
  }
}
