import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface RackspaceOptions { username: string; apiKey: string }
export class RackspaceProvider extends HttpProviderBase {
  readonly id = 'rackspace'; readonly name = 'Rackspace DNS'
  private readonly username: string; private readonly apiKey: string; private authToken = ''
  constructor(o: RackspaceOptions) {
    super('https://dns.api.rackspacecloud.com/v1.0')
    if (!o.username || !o.apiKey) throw new DnsProviderError('username and apiKey required', 'rackspace')
    this.username = o.username; this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.authToken } }
  private async auth(): Promise<void> {
    if (this.authToken) return
    const resp = await fetch('https://identity.api.rackspacecloud.com/v2.0/tokens', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth: { 'RAX-KSKEY:apiKeyCredentials': { username: this.username, apiKey: this.apiKey } } }),
    })
    const data = await resp.json() as Record<string, unknown>
    this.authToken = ((data.access as Record<string, unknown>)?.token as Record<string, string>)?.id ?? ''
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    await this.auth()
    const { domain } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.request('POST', `${this.baseUrl}/${zoneId}/records`, { records: [{ name: r.fulldomain, type: 'TXT', data: r.txtvalue, ttl: 300 }] })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      await this.auth()
      const { domain } = split2(r.fulldomain)
      const zoneId = await this.findZoneId(domain)
      const { data } = await this.request<{ records: Array<{ id: string; data: string }> }>('GET', `${this.baseUrl}/${zoneId}/records?type=TXT`)
      const m = data.records?.find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ domains: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/domains`)
    const zones = data.domains ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === c)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'rackspace')
  }
}
