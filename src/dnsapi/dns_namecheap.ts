import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface NamecheapOptions { apiKey: string; user: string }
export class NamecheapProvider extends HttpProviderBase {
  readonly id = 'namecheap'; readonly name = 'Namecheap'
  private readonly apiKey: string
  private readonly user: string
  constructor(options: NamecheapOptions) {
    super('https://api.namecheap.com/xml.response')
    if (!options.apiKey || !options.user) throw new DnsProviderError('apiKey and user required', 'namecheap')
    this.apiKey = options.apiKey
    this.user = options.user
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private ncUrl(domain: string, action: string, params: Record<string, string>): string {
    const { domain: sld } = split2(domain)
    const tld = sld.split('.').pop() ?? ''
    const sldOnly = sld.split('.')[0] ?? sld
    const qs = new URLSearchParams({
      ApiKey: this.apiKey, ApiUser: this.user, UserName: this.user,
      Command: `namecheap.domains.dns.${action}`, ClientIp: '127.0.0.1',
      SLD: sldOnly, TLD: tld, ...params,
    })
    return `${this.baseUrl}?${qs}`
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const url = this.ncUrl(r.fulldomain, 'setHosts', {
      HostName1: split2(r.fulldomain).sub, RecordType1: 'TXT', Address1: r.txtvalue, TTL1: '300',
    })
    await fetch(url)
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try { await fetch(this.ncUrl(r.fulldomain, 'setHosts', {})) } catch {}
  }
}
