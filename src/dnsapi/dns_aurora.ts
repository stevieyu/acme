import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface AuroraOptions { apiKey: string; secret: string }
export class AuroraProvider extends HmacProviderBase {
  readonly id = 'aurora'; readonly name = 'Aurora DNS'
  private readonly apiKey: string
  private readonly secret: string
  constructor(options: AuroraOptions) {
    super('https://api.auroradns.eu')
    if (!options.apiKey || !options.secret) throw new DnsProviderError('apiKey and secret required', 'aurora')
    this.apiKey = options.apiKey
    this.secret = options.secret
  }
  protected async buildSignedHeaders(method: string, url: string, body?: unknown): Promise<Record<string, string>> {
    const date = new Date().toUTCString()
    const path = url.replace(/^https?:\/\/[^/]+/, '')
    const hash = body ? await hashHex(JSON.stringify(body)) : ''
    const sig = await this.hmacSign(new TextEncoder().encode(this.secret), `${method}${path}${date}${hash}`)
    return { 'X-AuroraDNS-ApiKey': this.apiKey, 'X-AuroraDNS-Date': date, 'X-AuroraDNS-Signature': sig }
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || ''
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/records`, { type: 'TXT', name, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; content: string }>>('GET', `${this.baseUrl}/zones/${zoneId}/records`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/records/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/zones`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'aurora')
  }
}

// ─── helpers ────────────────────────────────────────────────────
async function hashHex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const bytes = new Uint8Array(hash)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}
