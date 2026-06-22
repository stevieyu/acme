import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface BaiduOptions { accessKeyId: string; secretAccessKey: string }

const BAIDU_DNS_API = 'https://dns.baidubce.com'

export class BaiduProvider extends HmacProviderBase {
  readonly id = 'baidu'; readonly name = 'Baidu Cloud DNS'
  private readonly akId: string
  private readonly akSecret: string
  constructor(options: BaiduOptions) {
    super(BAIDU_DNS_API)
    if (!options.accessKeyId || !options.secretAccessKey) throw new DnsProviderError('accessKeyId and secretAccessKey required', 'baidu')
    this.akId = options.accessKeyId
    this.akSecret = options.secretAccessKey
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> { return {} }

  private async bdRequest(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const authStringPrefix = `bce-auth-v1/${this.akId}/${timestamp}/1800`
    const signingKey = await hmacRaw(new TextEncoder().encode(this.akSecret), authStringPrefix)

    const canonicalUri = path
    const canonicalRequest = `${method.toUpperCase()}\n${encodeURI(canonicalUri)}\n\nhost:dns.baidubce.com`
    const signedHeaders = 'host'
    const signature = hexEncode(await hmacRaw(signingKey, canonicalRequest))
    const authorization = `${authStringPrefix}/${signedHeaders}/${signature}`

    const headers: Record<string, string> = {
      'Host': 'dns.baidubce.com',
      'Authorization': authorization,
      'x-bce-request-id': nonce,
    }
    if (body) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${this.baseUrl}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await response.json() as Record<string, unknown>
    if (!response.ok) throw new DnsProviderError(`API error: ${JSON.stringify(data)}`, 'baidu')
    return data
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.bdRequest('POST', `/v1/dns/zone/${zoneId}/record`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const zoneId = await this.findZoneId(domain)
      const data = await this.bdRequest('GET', `/v1/dns/zone/${zoneId}/record?name=${sub}&type=TXT`)
      const records = (data.records as Array<{ id: string; value: string }> | undefined) ?? []
      const m = records.find(x => x.value === r.txtvalue)
      if (m) await this.bdRequest('DELETE', `/v1/dns/zone/${zoneId}/record/${m.id}`)
    } catch { /* treat as success */ }
  }
  private async findZoneId(domain: string): Promise<string> {
    const data = await this.bdRequest('GET', '/v1/dns/zone')
    const zones = (data.zones as Array<{ id: string; name: string }> | undefined) ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate || z.name === `${candidate}.`)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'baidu')
  }
}

// ─── helpers ────────────────────────────────────────────────────
async function hmacRaw(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

function hexEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}
