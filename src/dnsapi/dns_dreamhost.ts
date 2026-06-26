import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface DreamhostOptions { apiKey: string }
export class DreamhostProvider extends HttpProviderBase {
  readonly id = 'dreamhost'; readonly name = 'DreamHost'
  private readonly apiKey: string
  constructor(o: DreamhostOptions) {
    super('https://api.dreamhost.com')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'dreamhost')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ key: this.apiKey, cmd: 'dns-add_record', record: r.fulldomain, type: 'TXT', value: r.txtvalue, format: 'json' })
    await fetch(`${this.baseUrl}/?${params}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ key: this.apiKey, cmd: 'dns-remove_record', record: r.fulldomain, type: 'TXT', value: r.txtvalue, format: 'json' })
      await fetch(`${this.baseUrl}/?${params}`)
    } catch {}
  }
}
