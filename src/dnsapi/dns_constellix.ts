import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface ConstellixOptions { apiKey: string; secretKey: string }

export class ConstellixProvider extends HmacProviderBase {
  readonly id = 'constellix'; readonly name = 'Constellix DNS'
  private readonly apiKey: string
  private readonly secretKey: string
  constructor(options: ConstellixOptions) {
    super('https://api.dns.constellix.com/v1')
    if (!options.apiKey || !options.secretKey) throw new DnsProviderError('apiKey and secretKey required', 'constellix')
    this.apiKey = options.apiKey
    this.secretKey = options.secretKey
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> {
    const timestamp = Date.now().toString()
    const signature = base64Encode(await hmacRaw(new TextEncoder().encode(this.secretKey), timestamp))
    return {
      'x-cns apiKey': this.apiKey,
      'x-cns requestTimestamp': timestamp,
      'x-cns signature': signature,
    }
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, {
      records: [{ name, type: 'txt', value: r.txtvalue, ttl: 300 }],
    })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<Array<{ id: string; name: string; value: string }>>('GET', `${this.baseUrl}/domains/${zoneId}/records?type=txt`)
      const records = Array.isArray(data) ? data : []
      const m = records.find(x => x.value === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/domains/${zoneId}/records/${m.id}`)
    } catch { /* treat as success */ }
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<Array<{ id: string; name: string }>>('GET', `${this.baseUrl}/domains`)
    const zones = Array.isArray(data) ? data : []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      const m = zones.find(z => z.name === candidate)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'constellix')
  }
}

// ─── helpers ────────────────────────────────────────────────────
async function hmacRaw(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

function base64Encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
