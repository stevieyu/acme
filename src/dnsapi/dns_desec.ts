import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface DesecOptions { token: string }
export class DesecProvider extends HttpProviderBase {
  readonly id = 'desec'; readonly name = 'deSEC'
  private readonly token: string
  constructor(options: DesecOptions) {
    super('https://desec.io/api/v1')
    if (!options.token) throw new DnsProviderError('token required', 'desec')
    this.token = options.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Token ${this.token}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/domains/${domain}/rrsets/`, [{ subname: sub, type: 'TXT', records: [`"${r.txtvalue}"`], ttl: 300 }])
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('PATCH', `${this.baseUrl}/domains/${domain}/rrsets/`, [{ subname: sub, type: 'TXT', records: [] }]) } catch {}
  }
}
