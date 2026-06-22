import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface SelfhostOptions { user: string; password: string }
export class SelfhostProvider extends HttpProviderBase {
  readonly id = 'selfhost'; readonly name = 'SelfHost.de'
  private readonly auth: string
  constructor(o: SelfhostOptions) {
    super('https://selfhost.de/cgi-bin/api.cgi')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'selfhost')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}?cmd=CreateRecord&rr=${r.fulldomain}&type=TXT&data=${encodeURIComponent(r.txtvalue)}&ttl=300`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}?cmd=DeleteRecord&rr=${r.fulldomain}&type=TXT`, { headers: this.buildAuthHeaders() }) } catch {}
  }
}
