import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface AcmednsOptions { url: string; user: string; key: string; subdomain: string }
export class AcmednsProvider extends HttpProviderBase {
  readonly id = 'acmedns'; readonly name = 'acme-dns'
  private readonly user: string; private readonly key: string; private readonly sub: string
  constructor(o: AcmednsOptions) {
    super(o.url || 'https://auth.acme-dns.io')
    if (!o.user || !o.key || !o.subdomain) throw new DnsProviderError('user, key and subdomain required', 'acmedns')
    this.user = o.user; this.key = o.key; this.sub = o.subdomain
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-User': this.user, 'X-Api-Key': this.key } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/update`, { subdomain: this.sub, txt: r.txtvalue })
  }
  async deleteTxtRecord(_r: TxtRecordInput): Promise<void> {
    // acme-dns doesn't support deletion, just overwrite
  }
}
