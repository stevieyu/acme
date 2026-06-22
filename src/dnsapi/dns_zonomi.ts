import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface ZonomiOptions { apiKey: string }
export class ZonomiProvider extends HttpProviderBase {
  readonly id = 'zonomi'; readonly name = 'Zonomi'
  private readonly apiKey: string
  constructor(o: ZonomiOptions) {
    super('https://api.zonomi.com/app')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zonomi')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ api_key: this.apiKey, action: 'SET', name: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/dns/dyndns.jsp?${params}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ api_key: this.apiKey, action: 'DELETE', name: r.fulldomain, type: 'TXT' })
      await fetch(`${this.baseUrl}/dns/dyndns.jsp?${params}`)
    } catch {}
  }
}
