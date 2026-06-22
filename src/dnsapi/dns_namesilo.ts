import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface NamesiloOptions { apiKey: string }
export class NamesiloProvider extends HttpProviderBase {
  readonly id = 'namesilo'; readonly name = 'Namesilo'
  private readonly apiKey: string
  constructor(options: NamesiloOptions) {
    super('https://www.namesilo.com/api')
    if (!options.apiKey) throw new DnsProviderError('apiKey required', 'namesilo')
    this.apiKey = options.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain, rrhost: sub, rrvalue: r.txtvalue, rrttl: '3600' })
    await fetch(`${this.baseUrl}/dnsAddRecord?${params}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain })
      const resp = await fetch(`${this.baseUrl}/dnsListRecords?${params}`)
      const data = await resp.json() as Record<string, unknown>
      const records = ((data.reply as Record<string, unknown>)?.resource_record ?? []) as Array<{ record_id: string; value: string }>
      const m = records.find((x: { value: string }) => x.value === r.txtvalue)
      if (m) {
        const dp = new URLSearchParams({ version: '1', type: 'json', key: this.apiKey, domain, rrid: m.record_id })
        await fetch(`${this.baseUrl}/dnsDeleteRecord?${dp}`)
      }
    } catch {}
  }
}
