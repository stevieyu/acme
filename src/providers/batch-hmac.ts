import { HmacProviderBase } from './base-hmac.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

// ─── Tencent Cloud DNS ──────────────────────────────────────────
export interface TencentOptions { secretId: string; secretKey: string }

const TENCENT_DNS_API = 'https://dnspod.tencentcloudapi.com'

export class TencentProvider extends HmacProviderBase {
  readonly id = 'tencent'; readonly name = 'Tencent Cloud DNS'
  private readonly secretId: string
  private readonly secretKey: string
  constructor(options: TencentOptions) {
    super(TENCENT_DNS_API)
    if (!options.secretId || !options.secretKey) throw new DnsProviderError('secretId and secretKey required', 'tencent')
    this.secretId = options.secretId
    this.secretKey = options.secretKey
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> { return {} }

  private async tcRequest(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const timestamp = Math.floor(Date.now() / 1000)
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
    const body = JSON.stringify(payload)

    const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:dnspod.tencentcloudapi.com\n\ncontent-type;host\n${await sha256Hex(body)}`
    const credentialScope = `${date}/dnspod/tc3_request`
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`

    const secretDate = await hmacRaw(new TextEncoder().encode(`TC3${this.secretKey}`), date)
    const secretService = await hmacRaw(secretDate, 'dnspod')
    const secretSigning = await hmacRaw(secretService, 'tc3_request')
    const signature = hexEncode(await hmacRaw(secretSigning, stringToSign))

    const authorization = `TC3-HMAC-SHA256 Credential=${this.secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'dnspod.tencentcloudapi.com',
        'Authorization': authorization,
        'X-TC-Action': action,
        'X-TC-Timestamp': String(timestamp),
        'X-TC-Version': '2021-03-23',
      },
      body,
    })
    const data = await response.json() as Record<string, unknown>
    const resp = data.Response as Record<string, unknown> | undefined
    if (resp?.Error) {
      const err = resp.Error as Record<string, string>
      throw new DnsProviderError(`API error ${err.Code}: ${err.Message}`, 'tencent')
    }
    return resp ?? {}
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.tcRequest('CreateRecord', { Domain: domain, SubDomain: sub, RecordType: 'TXT', RecordLine: '默认', Value: r.txtvalue, TTL: 600 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const data = await this.tcRequest('DescribeRecordList', { Domain: domain, Subdomain: sub, RecordType: 'TXT' })
      const list = (data.RecordList as Array<{ RecordId: string; Value: string }> | undefined) ?? []
      const m = list.find(x => x.Value === r.txtvalue)
      if (m) await this.tcRequest('DeleteRecord', { Domain: domain, RecordId: m.RecordId })
    } catch { /* treat as success */ }
  }
}

// ─── Baidu Cloud DNS ────────────────────────────────────────────
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

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const zoneId = await this.findZoneId(domain)
    await this.bdRequest('POST', `/v1/dns/zone/${zoneId}/record`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
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

// ─── JD Cloud DNS ───────────────────────────────────────────────
export interface JdOptions { accessKeyId: string; secretAccessKey: string }

const JD_DNS_API = 'https://dns.jdcloudapi.com'

export class JdProvider extends HmacProviderBase {
  readonly id = 'jd'; readonly name = 'JD Cloud DNS'
  private readonly akId: string
  private readonly akSecret: string
  constructor(options: JdOptions) {
    super(JD_DNS_API)
    if (!options.accessKeyId || !options.secretAccessKey) throw new DnsProviderError('accessKeyId and secretAccessKey required', 'jd')
    this.akId = options.accessKeyId
    this.akSecret = options.secretAccessKey
  }
  protected async buildSignedHeaders(): Promise<Record<string, string>> { return {} }

  private async jdRequest(action: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const date = timestamp.slice(0, 10)
    const jsonBody = JSON.stringify(body)

    const canonicalRequest = `POST\n/v1/regions/cn-north-1\n\nhost:dns.jdcloudapi.com\ncontent-type:application/json\n\nhost;content-type\n${await sha256Hex(jsonBody)}`
    const credentialScope = `${date}/dns/jdcloud2_request`
    const stringToSign = `JDCLOUD2-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`

    const kDate = await hmacRaw(new TextEncoder().encode(`JDCLOUD2${this.akSecret}`), date)
    const kService = await hmacRaw(kDate, 'dns')
    const kSigning = await hmacRaw(kService, 'jdcloud2_request')
    const signature = hexEncode(await hmacRaw(kSigning, stringToSign))

    const authorization = `JDCLOUD2-HMAC-SHA256 Credential=${this.akId}/${credentialScope}, SignedHeaders=host;content-type, Signature=${signature}`

    const response = await fetch(`${this.baseUrl}/v1/regions/cn-north-1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'dns.jdcloudapi.com',
        'Authorization': authorization,
        'X-Jdcloud-Action': action,
        'X-Jdcloud-Version': '2.0',
      },
      body: jsonBody,
    })
    const data = await response.json() as Record<string, unknown>
    if (!response.ok || data.error) throw new DnsProviderError(`API error: ${JSON.stringify(data)}`, 'jd')
    return data.result as Record<string, unknown> ?? {}
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.jdRequest('CreateResourceRecord', { domainName: domain, name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const data = await this.jdRequest('DescribeResourceRecords', { domainName: domain, name: sub, type: 'TXT' })
      const list = (data.dataList as Array<{ id: string; value: string }> | undefined) ?? []
      const m = list.find(x => x.value === r.txtvalue)
      if (m) await this.jdRequest('DeleteResourceRecord', { domainName: domain, id: m.id })
    } catch { /* treat as success */ }
  }
}

// ─── Edgedns (Akamai) ───────────────────────────────────────────
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

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
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
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const url = `https://${this.host}/config-dns/v2/zones/${domain}/names/${sub}/types/TXT`
    try {
      const headers = await this.buildSignedHeaders('DELETE', url)
      await fetch(url, { method: 'DELETE', headers })
    } catch { /* treat as success */ }
  }
}

// ─── Constellix ─────────────────────────────────────────────────
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

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    const { domain } = split2(r.fulldomain)
    const name = r.fulldomain.slice(0, -(domain.length + 1)) || '@'
    await this.request('POST', `${this.baseUrl}/domains/${zoneId}/records`, {
      records: [{ name, type: 'txt', value: r.txtvalue, ttl: 300 }],
    })
  }
  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
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
function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  const domain = parts.slice(-2).join('.')
  const sub = parts.slice(0, -2).join('.')
  return { domain, sub: sub || '@' }
}

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
