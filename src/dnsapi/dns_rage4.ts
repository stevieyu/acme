import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface Rage4Options { email: string; token: string }
export class Rage4Provider extends HttpProviderBase {
  readonly id = 'rage4'; readonly name = 'Rage4'
  private readonly auth: string
  constructor(o: Rage4Options) {
    super('https://rage4.com/rapi')
    if (!o.email || !o.token) throw new DnsProviderError('email and token required', 'rage4')
    this.auth = `Basic ${btoa(`${o.email}:${o.token}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.fz(r.fulldomain)
    await this.request('GET', `${this.baseUrl}/createrecord/?id=${zoneId}&name=${r.fulldomain}&type=TXT&content=${encodeURIComponent(r.txtvalue)}&ttl=300`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.fz(r.fulldomain)
      const { data } = await this.request<Array<{ id: number; content: string }>>('GET', `${this.baseUrl}/showrecords/?id=${zoneId}`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('GET', `${this.baseUrl}/deleterecord/?id=${m.id}`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<Array<{ id: number; name: string }>>('GET', `${this.baseUrl}/showzones/`)
    const zones = Array.isArray(data) ? data : []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.name === c); if (m) return String(m.id) }
    throw new DnsProviderError(`zone not found for ${d}`, 'rage4')
  }
}
