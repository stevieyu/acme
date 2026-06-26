import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface LuadnsOptions { email: string; apiKey: string }
export class LuadnsProvider extends HttpProviderBase {
  readonly id = 'luadns'; readonly name = 'LuaDNS'
  private readonly auth: string
  constructor(o: LuadnsOptions) {
    super('https://api.luadns.com/v1')
    if (!o.email || !o.apiKey) throw new DnsProviderError('email and apiKey required', 'luadns')
    this.auth = `Basic ${btoa(`${o.email}:${o.apiKey}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/records`, { name: `${r.fulldomain}.`, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', `${this.baseUrl}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === `${c}.` || z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'luadns')
  }
}
