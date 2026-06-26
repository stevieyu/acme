import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface NjallaOptions { token: string }
export class NjallaProvider extends HttpProviderBase {
  readonly id = 'njalla'; readonly name = 'Njalla'
  private readonly token: string
  constructor(o: NjallaOptions) {
    super('https://app.njalla.im/1/')
    if (!o.token) throw new DnsProviderError('token required', 'njalla')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Njalla ${this.token}` } }
  private async njCall(method: string, params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.request<{ result: unknown }>('POST', this.baseUrl, { method, params })
    return data.result
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.njCall('add-record', { name: domain, record: { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 } })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const result = await this.njCall('list-records', { name: domain }) as Array<{ id: number; content: string }>
      const m = (result ?? []).find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.njCall('remove-record', { name: domain, id: m.id })
    } catch {}
  }
}
