import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface GandiLiveDnsOptions { token: string }
export class GandiLiveDnsProvider extends HttpProviderBase {
  readonly id = 'gandi_livedns'; readonly name = 'Gandi LiveDNS'
  private readonly token: string
  constructor(options: GandiLiveDnsOptions) {
    super('https://api.gandi.net/v5/livedns')
    if (!options.token) throw new DnsProviderError('token required', 'gandi_livedns')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/domains/${domain}/records/${sub}/TXT`, { rrset_values: [r.txtvalue], rrset_ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/${sub}/TXT`) } catch {}
  }
}
