import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface FreednsOptions { token: string }
export class FreednsProvider extends HttpProviderBase {
  readonly id = 'freedns'; readonly name = 'FreeDNS'
  private readonly token: string
  constructor(o: FreednsOptions) {
    super('https://freedns.afraid.org/api')
    if (!o.token) throw new DnsProviderError('token required', 'freedns')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await fetch(`${this.baseUrl}/?action=add&domain=${r.fulldomain}&type=TXT&value=${encodeURIComponent(r.txtvalue)}&token=${this.token}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await fetch(`${this.baseUrl}/?action=delete&domain=${r.fulldomain}&token=${this.token}`) } catch {}
  }
}
