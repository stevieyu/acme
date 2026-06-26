import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface IspconfigOptions { url: string; user: string; password: string }
export class IspconfigProvider extends HttpProviderBase {
  readonly id = 'ispconfig'; readonly name = 'ISPConfig'
  private readonly user: string; private readonly password: string; private sessionId = ''
  constructor(o: IspconfigOptions) {
    super(o.url || 'https://localhost:8080/remote/json.php')
    if (!o.url || !o.user || !o.password) throw new DnsProviderError('url, user and password required', 'ispconfig')
    this.user = o.user; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private async icCall(fn: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.sessionId) {
      const { data } = await this.request<{ response: string }>('POST', this.baseUrl, { session_login: this.user, session_password: this.password })
      this.sessionId = data.response
    }
    const { data } = await this.request<{ response: unknown }>('POST', this.baseUrl, { session_id: this.sessionId, ...params, fn })
    return data.response
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.icCall('dns_txt_add', { zone_id: domain, params: { name: sub, type: 'txt', data: r.txtvalue, ttl: 300, active: 'y' } })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await this.icCall('dns_txt_delete', { primary_id: r.fulldomain }) } catch {}
  }
}
