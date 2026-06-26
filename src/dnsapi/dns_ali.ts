import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface AliyunOptions {
  accessKeyId: string
  accessKeySecret: string
}

const ALIYUN_DNS_API = 'https://alidns.aliyuncs.com'

export class AliyunProvider extends HmacProviderBase {
  readonly id = 'ali'
  readonly name = 'Aliyun DNS'

  private readonly akId: string
  private readonly akSecret: string

  constructor(options: AliyunOptions) {
    super(ALIYUN_DNS_API)
    if (!options.accessKeyId || !options.accessKeySecret) {
      throw new DnsProviderError('accessKeyId and accessKeySecret required', 'ali')
    }
    this.akId = options.accessKeyId
    this.akSecret = options.accessKeySecret
  }

  protected async buildSignedHeaders(): Promise<Record<string, string>> {
    return {}
  }

  private async aliRequest(action: string, params: Record<string, string>): Promise<Record<string, unknown>> {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const nonce = `${Date.now()}_${Math.random().toString(36).slice(2)}`

    const commonParams: Record<string, string> = {
      Format: 'JSON',
      Version: '2015-01-09',
      AccessKeyId: this.akId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      Timestamp: timestamp,
      Action: action,
      ...params,
    }

    // Sort and build canonical query string
    const sorted = Object.keys(commonParams).sort()
    const canonicalized = sorted
      .map(k => `${aliUrlEncode(k)}=${aliUrlEncode(commonParams[k]!)}`)
      .join('&')

    const stringToSign = `GET&${aliUrlEncode('/')}&${aliUrlEncode(canonicalized)}`
    const signature = await this.hmacSignBase64(
      new TextEncoder().encode(this.akSecret + '&'),
      stringToSign,
      'SHA-1',
    )

    const url = `${this.baseUrl}/?${canonicalized}&Signature=${aliUrlEncode(signature)}`

    const response = await fetch(url, { method: 'GET' })
    const data = await response.json() as Record<string, unknown>

    if (!response.ok) {
      const code = data.Code ?? 'Unknown'
      const message = data.Message ?? JSON.stringify(data)
      throw new DnsProviderError(`API error ${code}: ${message}`, 'ali')
    }

    return data
  }

  async createTxtRecord(record: TxtRecordInput): Promise<void> {
    const { domainName, rr } = splitAliDomain(record.fulldomain)
    this.ctx.logger.debug(`ali: creating TXT ${rr}.${domainName} = ${record.txtvalue}`)

    await this.aliRequest('AddDomainRecord', {
      DomainName: domainName,
      RR: rr,
      Type: 'TXT',
      Value: record.txtvalue,
      TTL: '600',
    })
  }

  async deleteTxtRecord(record: TxtRecordInput): Promise<void> {
    const { domainName, rr } = splitAliDomain(record.fulldomain)
    this.ctx.logger.debug(`ali: deleting TXT ${rr}.${domainName}`)

    // List records to find matching RecordId
    const data = await this.aliRequest('DescribeDomainRecords', {
      DomainName: domainName,
      RRKeyWord: rr,
      TypeKeyWord: 'TXT',
      ValueKeyWord: record.txtvalue,
    })

    const records = ((data.DomainRecords as Record<string, unknown>)?.Record ?? []) as Array<{
      RecordId: string; RR: string; Value: string
    }>

    const match = records.find(r => r.RR === rr && r.Value === record.txtvalue)
    if (!match) {
      this.ctx.logger.debug(`ali: TXT record not found, nothing to delete`)
      return
    }

    try {
      await this.aliRequest('DeleteDomainRecord', { RecordId: match.RecordId })
    } catch {
      this.ctx.logger.debug(`ali: delete failed, treating as success`)
    }
  }
}

function aliUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
}

function splitAliDomain(fulldomain: string): { domainName: string; rr: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) {
    return { domainName: fulldomain, rr: '@' }
  }
  // Aliyun: last 2 parts are domain, rest is RR
  // ponytail: simple split, doesn't handle multi-level TLDs
  const domainName = parts.slice(-2).join('.')
  const rr = parts.slice(0, -2).join('.')
  return { domainName, rr: rr || '@' }
}
