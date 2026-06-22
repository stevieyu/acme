import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface JokerOptions { apiKey: string }
export class JokerProvider extends HttpProviderBase {
  readonly id = 'joker'; readonly name = 'Joker.com'
  private readonly apiKey: string
  constructor(o: JokerOptions) {
    super('https://dmapi.joker.com/request')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'joker')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Auth-Api-Key': this.apiKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await fetch(`${this.baseUrl}/dns-zone-get?domain=${domain}`, { headers: this.buildAuthHeaders() })
    await fetch(`${this.baseUrl}/dns-zone-put?domain=${domain}&zone=${sub} TXT 0 ${r.txtvalue} 300`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { domain } = split2(r.fulldomain)
      await fetch(`${this.baseUrl}/dns-zone-put?domain=${domain}&zone=`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}
