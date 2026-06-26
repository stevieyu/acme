import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface PddOptions { token: string }
export class PddProvider extends HttpProviderBase {
  readonly id = 'pdd'; readonly name = 'Yandex PDD'
  private readonly token: string
  constructor(o: PddOptions) {
    super('https://pddimp.yandex.ru/api2')
    if (!o.token) throw new DnsProviderError('token required', 'pdd')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'PddToken': this.token } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ domain, subdomain: sub, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/admin/dns/add?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ domain })
      const resp = await fetch(`${this.baseUrl}/admin/dns/list?${params}`, { headers: this.buildAuthHeaders() })
      const data = await resp.json() as Record<string, unknown>
      const records = (data.records as Array<{ record_id: number; content: string }> | undefined) ?? []
      const m = records.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) {
        const dp = new URLSearchParams({ domain, record_id: String(m.record_id) })
        await fetch(`${this.baseUrl}/admin/dns/del?${dp}`, { headers: this.buildAuthHeaders() })
      }
    } catch {}
  }
}
