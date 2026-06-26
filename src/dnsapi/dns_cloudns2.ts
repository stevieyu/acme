import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface Cloudns2Options { authId: string; authPassword: string }
export class Cloudns2Provider extends HttpProviderBase {
  readonly id = 'cloudns2'; readonly name = 'ClouDNS V2'
  private readonly authId: string; private readonly authPass: string
  constructor(o: Cloudns2Options) {
    super('https://api.cloudns.net')
    if (!o.authId || !o.authPassword) throw new DnsProviderError('authId and authPassword required', 'cloudns2')
    this.authId = o.authId; this.authPass = o.authPassword
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/add-record.json`, { 'auth-id': this.authId, 'auth-password': this.authPass, domain_name: domain, record_type: 'TXT', host: sub, record: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const { data } = await this.request<Record<string, { id: string; record: string }>>('GET', `${this.baseUrl}/dns/records.json?auth-id=${this.authId}&auth-password=${this.authPass}&domain-name=${domain}&type=TXT`)
      const list = Object.values(data)
      const m = list.find((x: { record: string }) => x.record === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete-record.json`, { 'auth-id': this.authId, 'auth-password': this.authPass, domain_name: domain, record_id: m.id })
    } catch {}
  }
}
