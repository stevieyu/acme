import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface RuOptions { apiKey: string }
export class RuProvider extends HttpProviderBase {
  readonly id = 'ru'; readonly name = 'RU DNS'
  private readonly apiKey: string
  constructor(o: RuOptions) {
    super('https://api.nic.ru/dns')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'ru')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/${domain}/records/TXT/${sub}`) } catch {}
  }
}
