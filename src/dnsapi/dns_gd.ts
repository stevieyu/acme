import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface GdOptions { key: string; secret: string }
export class GdProvider extends HttpProviderBase {
  readonly id = 'gd'; readonly name = 'GoDaddy'
  private readonly authHeader: string
  constructor(options: GdOptions) {
    super('https://api.godaddy.com/v1')
    if (!options.key || !options.secret) throw new DnsProviderError('key and secret required', 'gd')
    this.authHeader = `sso-key ${options.key}:${options.secret}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.authHeader } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/v1/domains/${domain}/records/TXT/${sub}`, [{ data: r.txtvalue, ttl: 600 }])
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/v1/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}
