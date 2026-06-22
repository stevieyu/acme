import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface WebsupportOptions { apiKey: string; secret: string }
export class WebsupportProvider extends HmacProviderBase {
  readonly id = 'websupport'; readonly name = 'Websupport'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: WebsupportOptions) {
    super('https://rest.websupport.sk/v1')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'websupport')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string): Promise<Record<string, string>> {
    const ts = Math.floor(Date.now() / 1000).toString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const canonical = `${method.toUpperCase()} ${path} ${ts}`
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), canonical)
    return { 'Authorization': `WS ${this.apiKey}:${sig}:${ts}` }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/user/self/zone/${zoneId}/record`, { type: 'TXT', name, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ items: Array<{ id: number; content: string }> }>('GET', `${this.baseUrl}/user/self/zone/${zoneId}/record`)
      const items = data.items ?? []
      const m = items.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/user/self/zone/${zoneId}/record/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ items: Array<{ id: number; name: string }> }>('GET', `${this.baseUrl}/user/self/zone`)
    const zones = data.items ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate)
      if (m) return String(m.id)
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'websupport')
  }
}
