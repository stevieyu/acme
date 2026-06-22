import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface CloudnsOptions { authId: string; authPassword: string }
export class CloudnsProvider extends HttpProviderBase {
  readonly id = 'cloudns'; readonly name = 'ClouDNS'
  private readonly authId: string; private readonly authPass: string
  constructor(o: CloudnsOptions) {
    super('https://api.cloudns.net')
    if (!o.authId || !o.authPassword) throw new DnsProviderError('authId and authPassword required', 'cloudns')
    this.authId = o.authId; this.authPass = o.authPassword
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private authParams(): string { return `auth-id=${this.authId}&auth-password=${this.authPass}` }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/add-record.json?${this.authParams()}`, { domain_name: domain, record_type: 'TXT', host: sub, record: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Array<{ id: string; record: string; type: string }>>(`GET`, `${this.baseUrl}/dns/records.json?${this.authParams()}&domain-name=${domain}&type=TXT`)
      const list = Array.isArray(data) ? data : Object.values(data as Record<string, unknown>) as Array<{ id: string; record: string; type: string }>
      const m = list.find((x: { record: string; type: string }) => x.type === 'TXT' && x.record === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete-record.json?${this.authParams()}`, { domain_name: domain, record_id: m.id })
    } catch {}
  }
}
