import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface ScalewayOptions { secretKey: string; projectId: string }
export class ScalewayProvider extends HttpProviderBase {
  readonly id = 'scaleway'; readonly name = 'Scaleway DNS'
  private readonly secretKey: string
  constructor(o: ScalewayOptions) {
    super('https://api.scaleway.com/domain/v2beta1')
    if (!o.secretKey || !o.projectId) throw new DnsProviderError('secretKey and projectId required', 'scaleway')
    this.secretKey = o.secretKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.secretKey } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns-zones/${domain}/records`, { name: sub, type: 'TXT', data: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns-zones/${domain}/records/${sub}/TXT`) } catch {}
  }
}
