import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface TransipOptions { username: string; apiKey: string }
export class TransipProvider extends HttpProviderBase {
  readonly id = 'transip'; readonly name = 'TransIP'
  private readonly apiKey: string
  constructor(o: TransipOptions) {
    super('https://api.transip.nl/v6')
    if (!o.username || !o.apiKey) throw new DnsProviderError('username and apiKey required', 'transip')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/dns`, { name: sub, type: 'TXT', content: r.txtvalue, expire: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/dns`, { name: sub, type: 'TXT', content: r.txtvalue, expire: 300 }) } catch {}
  }
}
