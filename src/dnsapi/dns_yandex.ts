import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface YandexOptions { token: string }
export class YandexProvider extends HttpProviderBase {
  readonly id = 'yandex'; readonly name = 'Yandex DNS'
  private readonly token: string
  constructor(o: YandexOptions) {
    super('https://pddimp.yandex.ru/api2')
    if (!o.token) throw new DnsProviderError('token required', 'yandex')
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
      const resp = await fetch(`${this.baseUrl}/admin/dns/list?domain=${domain}`, { headers: this.buildAuthHeaders() })
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
