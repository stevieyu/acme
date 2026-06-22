import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface AcmeproxyOptions { url: string; username: string; password: string }
export class AcmeproxyProvider extends HttpProviderBase {
  readonly id = 'acmeproxy'; readonly name = 'acme-proxy'
  private readonly auth: string
  constructor(o: AcmeproxyOptions) {
    super(o.url || 'https://localhost')
    if (!o.url || !o.username || !o.password) throw new DnsProviderError('url, username and password required', 'acmeproxy')
    this.auth = `Basic ${btoa(`${o.username}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/present`, { fqdn: r.fulldomain, value: r.txtvalue })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await this.request('POST', `${this.baseUrl}/cleanup`, { fqdn: r.fulldomain, value: r.txtvalue }) } catch {}
  }
}
