import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface RegruOptions { username: string; password: string }
export class RegruProvider extends HttpProviderBase {
  readonly id = 'regru'; readonly name = 'Reg.ru'
  private readonly username: string; private readonly password: string
  constructor(o: RegruOptions) {
    super('https://api.reg.ru/api/regru2')
    if (!o.username || !o.password) throw new DnsProviderError('username and password required', 'regru')
    this.username = o.username; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ username: this.username, password: this.password, input_format: 'json', input_data: JSON.stringify({ domain: { dname: domain }, subdomain: sub, content: r.txtvalue, record_type: 'TXT', ttl: 300 }) })
    await fetch(`${this.baseUrl}/zone/add_record?${params}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ username: this.username, password: this.password, input_format: 'json', input_data: JSON.stringify({ domain: { dname: domain }, content: r.txtvalue, record_type: 'TXT' }) })
      await fetch(`${this.baseUrl}/zone/delete_record?${params}`)
    } catch {}
  }
}
