import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface EdgednsOptions { clientToken: string; clientSecret: string; accessToken: string; host: string }

export class EdgednsProvider extends HmacProviderBase {
  readonly id = 'edgedns'; readonly name = 'Akamai EdgeDNS'
  private readonly clientToken: string
  private readonly clientSecret: string
  private readonly accessToken: string
  private readonly host: string
  constructor(options: EdgednsOptions) {
    super('')
    if (!options.clientToken || !options.clientSecret || !options.accessToken || !options.host)
      throw new DnsProviderError('clientToken, clientSecret, accessToken and host required', 'edgedns')
    this.clientToken = options.clientToken
    this.clientSecret = options.clientSecret
    this.accessToken = options.accessToken
    this.host = options.host
  }
  protected async buildSignedHeaders(method: string, url: string, body?: unknown): Promise<Record<string, string>> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const bodyHash = body ? await sha256Hex(JSON.stringify(body)) : ''
    const authHeader = `EG1-HMAC-SHA256 client_token=${this.clientToken};access_token=${this.accessToken};timestamp=${timestamp};nonce=${nonce};`
    const signingKey = await hmacRaw(new TextEncoder().encode(this.clientSecret), timestamp)
    const dataToSign = `${method}\thttps\t${this.host}\t${url.replace(/^https?:\/\/[^/]+/, '')}\t\t${bodyHash}\t${authHeader}`
    const signature = base64Encode(await hmacRaw(signingKey, dataToSign))
    return {
      'Authorization': `${authHeader}signature=${signature}`,
      'Host': this.host,
    }
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const url = `https://${this.host}/config-dns/v2/zones/${domain}/names/${sub}/types/TXT`
    const headers = await this.buildSignedHeaders('PUT', url, { rdata: [r.txtvalue], ttl: 300 })
    headers['Content-Type'] = 'application/json'
    const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ rdata: [r.txtvalue], ttl: 300 }) })
    if (!response.ok) {
      const text = await response.text()
      throw new DnsProviderError(`HTTP ${response.status}: ${text}`, 'edgedns')
    }
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const url = `https://${this.host}/config-dns/v2/zones/${domain}/names/${sub}/types/TXT`
    try {
      const headers = await this.buildSignedHeaders('DELETE', url)
      await fetch(url, { method: 'DELETE', headers })
    } catch { /* treat as success */ }
  }
}

// ─── helpers ────────────────────────────────────────────────────
async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return hexEncode(hash)
}

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

function base64Encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
