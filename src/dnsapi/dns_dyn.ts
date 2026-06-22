import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface DynOptions { customer: string; username: string; password: string }
export class DynProvider extends HttpProviderBase {
  readonly id = 'dyn'; readonly name = 'Dyn DNS'
  private readonly customer: string; private readonly username: string; private readonly password: string
  private token = ''
  constructor(o: DynOptions) {
    super('https://api.dynect.net/REST')
    if (!o.customer || !o.username || !o.password) throw new DnsProviderError('customer, username and password required', 'dyn')
    this.customer = o.customer; this.username = o.username; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return this.token ? { 'Auth-Token': this.token } : {} }
  private async auth(): Promise<void> {
    if (this.token) return
    const { data } = await this.request<{ data: { token: string } }>('POST', `${this.baseUrl}/Session/`, { customer_name: this.customer, user_name: this.username, password: this.password })
    this.token = data.data.token
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await this.auth()
    const { domain } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/TXTRecord/${domain}/${r.fulldomain}/`, { rdata: { txtdata: r.txtvalue }, ttl: 300 })
    await this.request('PUT', `${this.baseUrl}/Zone/${domain}/`, { publish: true })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      await this.auth()
      const { domain } = split2(r.fulldomain)
      await this.request('DELETE', `${this.baseUrl}/TXTRecord/${domain}/${r.fulldomain}/`)
      await this.request('PUT', `${this.baseUrl}/Zone/${domain}/`, { publish: true })
    } catch {}
  }
}
