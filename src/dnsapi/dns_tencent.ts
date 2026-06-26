import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

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

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.tcRequest('CreateRecord', { Domain: domain, SubDomain: sub, RecordType: 'TXT', RecordLine: '默认', Value: r.txtvalue, TTL: 600 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const data = await this.tcRequest('DescribeRecordList', { Domain: domain, Subdomain: sub, RecordType: 'TXT' })
      const list = (data.RecordList as Array<{ RecordId: string; Value: string }> | undefined) ?? []
      const m = list.find(x => x.Value === r.txtvalue)
      if (m) await this.tcRequest('DeleteRecord', { Domain: domain, RecordId: m.RecordId })
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
