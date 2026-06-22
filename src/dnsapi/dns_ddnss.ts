import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface DdnssOptions { user: string; password: string }
export class DdnssProvider extends HttpProviderBase {
  readonly id = 'ddnss'; readonly name = 'DDNSS'
  private readonly auth: string
  constructor(o: DdnssOptions) {
    super('https://api.ddnss.de')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'ddnss')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}/upd.php?user=&pw=&hostname=${r.fulldomain}&txt=${encodeURIComponent(r.txtvalue)}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}/upd.php?user=&pw=&hostname=${r.fulldomain}&txt=`, { headers: this.buildAuthHeaders() }) } catch {}
  }
}
