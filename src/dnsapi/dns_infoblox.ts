import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface InfobloxOptions { url: string; user: string; password: string }
export class InfobloxProvider extends HttpProviderBase {
  readonly id = 'infoblox'; readonly name = 'Infoblox'
  private readonly auth: string
  constructor(o: InfobloxOptions) {
    super(o.url || 'https://localhost/wapi/v2.10')
    if (!o.url || !o.user || !o.password) throw new DnsProviderError('url, user and password required', 'infoblox')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/record:txt`, { name: r.fulldomain, text: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { data } = await this.request<Array<{ _ref: string; text: string }>>('GET', `${this.baseUrl}/record:txt?name=${r.fulldomain}`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { text: string }) => x.text === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${m._ref}`)
    } catch {}
  }
}
