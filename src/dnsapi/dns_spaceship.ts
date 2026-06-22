import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface SpaceshipOptions { apiKey: string; apiSecret: string }
export class SpaceshipProvider extends HttpProviderBase {
  readonly id = 'spaceship'; readonly name = 'Spaceship DNS'
  private readonly apiKey: string; private readonly apiSecret: string
  constructor(o: SpaceshipOptions) {
    super('https://api.spaceship.dev/v1')
    if (!o.apiKey || !o.apiSecret) throw new DnsProviderError('apiKey and apiSecret required', 'spaceship')
    this.apiKey = o.apiKey; this.apiSecret = o.apiSecret
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Api-Key': this.apiKey, 'X-Api-Secret': this.apiSecret } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/records/${domain}`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/records/${domain}/TXT/${r.fulldomain}`) } catch {}
  }
}
