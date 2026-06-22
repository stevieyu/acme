import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

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

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.jdRequest('CreateResourceRecord', { domainName: domain, name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const data = await this.jdRequest('DescribeResourceRecords', { domainName: domain, name: sub, type: 'TXT' })
      const list = (data.dataList as Array<{ id: string; value: string }> | undefined) ?? []
      const m = list.find(x => x.value === r.txtvalue)
      if (m) await this.jdRequest('DeleteResourceRecord', { domainName: domain, id: m.id })
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
