import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface MydnsjpOptions { user: string; password: string }
export class MydnsjpProvider extends HttpProviderBase {
  readonly id = 'mydnsjp'; readonly name = 'MyDNS.jp'
  private readonly auth: string
  constructor(o: MydnsjpOptions) {
    super('https://www.mydns.jp')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'mydnsjp')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ hostname: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/api/?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ hostname: r.fulldomain, type: 'TXT', content: '', ttl: '300', delete: '1' })
      await fetch(`${this.baseUrl}/api/?${params}`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}
