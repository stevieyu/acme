import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface InternetbsOptions { apiKey: string; password: string }
export class InternetbsProvider extends HttpProviderBase {
  readonly id = 'internetbs'; readonly name = 'Internet.bs'
  private readonly apiKey: string; private readonly password: string
  constructor(o: InternetbsOptions) {
    super('https://api.internet.bs')
    if (!o.apiKey || !o.password) throw new DnsProviderError('apiKey and password required', 'internetbs')
    this.apiKey = o.apiKey; this.password = o.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const params = new URLSearchParams({ ApiKey: this.apiKey, Password: this.password, Action: 'Domain/DnsRecord/Add', Domain: domain, Name: sub, Type: 'TXT', Value: r.txtvalue, TTL: '300', ResponseFormat: 'JSON' })
    await fetch(`${this.baseUrl}/?${params}`)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const params = new URLSearchParams({ ApiKey: this.apiKey, Password: this.password, Action: 'Domain/DnsRecord/Remove', Domain: domain, Name: sub, Type: 'TXT', Value: r.txtvalue, ResponseFormat: 'JSON' })
      await fetch(`${this.baseUrl}/?${params}`)
    } catch {}
  }
}
