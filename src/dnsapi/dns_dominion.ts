import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface DominionOptions { apiKey: string }
export class DominionProvider extends HttpProviderBase {
  readonly id = 'dominion'; readonly name = 'Dominio Directo'
  private readonly apiKey: string
  constructor(o: DominionOptions) {
    super('https://api.dominiodirecto.com/v2')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dominion')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}
