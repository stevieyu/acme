import type { DnsProvider, DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { _url_replace } from '../crypto/digest.ts'

export interface AwsOptions {
  accessKeyId: string
  secretAccessKey: string
  region?: string
}

const ROUTE53_HOST = 'route53.amazonaws.com'

export class AwsRoute53Provider implements DnsProvider {
  readonly id = 'aws'
  readonly name = 'AWS Route53'
  protected ctx!: DnsProviderContext

  private readonly akId: string
  private readonly akSecret: string
  private readonly region: string

  constructor(options: AwsOptions) {
    if (!options.accessKeyId || !options.secretAccessKey) {
      throw new DnsProviderError('accessKeyId and secretAccessKey required', 'aws')
    }
    this.akId = options.accessKeyId
    this.akSecret = options.secretAccessKey
    this.region = options.region ?? 'us-east-1'
  }

  setContext(ctx: DnsProviderContext): void {
    this.ctx = ctx
  }

  async createTxtRecord(record: TxtRecordInput): Promise<void> {
    const hostedZoneId = await this.findHostedZone(record.fulldomain)
    this.ctx.logger.debug(`aws: zone ${hostedZoneId} for ${record.fulldomain}`)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
  <ChangeBatch>
    <Changes>
      <Change>
        <Action>UPSERT</Action>
        <ResourceRecordSet>
          <Name>${record.fulldomain}.</Name>
          <Type>TXT</Type>
          <TTL>60</TTL>
          <ResourceRecords>
            <ResourceRecord><Value>"${record.txtvalue}"</Value></ResourceRecord>
          </ResourceRecords>
        </ResourceRecordSet>
      </Change>
    </Changes>
  </ChangeBatch>
</ChangeResourceRecordSetsRequest>`

    await this.signedRequest('POST', `/2013-04-01/hostedzone/${hostedZoneId}/rrset`, body)
  }

  async deleteTxtRecord(record: TxtRecordInput): Promise<void> {
    const hostedZoneId = await this.findHostedZone(record.fulldomain)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
  <ChangeBatch>
    <Changes>
      <Change>
        <Action>DELETE</Action>
        <ResourceRecordSet>
          <Name>${record.fulldomain}.</Name>
          <Type>TXT</Type>
          <TTL>60</TTL>
          <ResourceRecords>
            <ResourceRecord><Value>"${record.txtvalue}"</Value></ResourceRecord>
          </ResourceRecords>
        </ResourceRecordSet>
      </Change>
    </Changes>
  </ChangeBatch>
</ChangeResourceRecordSetsRequest>`

    try {
      await this.signedRequest('POST', `/2013-04-01/hostedzone/${hostedZoneId}/rrset`, body)
    } catch (err) {
      this.ctx.logger.debug(`aws: delete failed, treating as success`, err)
    }
  }

  private async findHostedZone(domain: string): Promise<string> {
    const { data } = await this.signedRequest('GET', '/2013-04-01/hostedzone')
    const parts = domain.split('.')

    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      // Parse XML response to find matching zone
      const match = data.match(new RegExp(
        `<Id>/hostedzone/([^<]+)</Id>[^]*?<Name>${escapeRegex(candidate)}\\.?</Name>`,
      ))
      if (match) return match[1]!
    }

    throw new DnsProviderError(`Could not find hosted zone for ${domain}`, 'aws')
  }

  private async signedRequest(method: string, path: string, body?: string): Promise<{ data: string; status: number }> {
    const url = `https://${ROUTE53_HOST}${path}`
    const now = new Date()
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const payloadHash = await sha256Hex(body ?? '')
    const headers: Record<string, string> = {
      'host': ROUTE53_HOST,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
    }

    const signedHeaderKeys = Object.keys(headers).sort().join(';')
    const canonicalHeaders = Object.keys(headers).sort()
      .map(k => `${k}:${headers[k]!.trim()}\n`)
      .join('')

    const canonicalRequest = [
      method,
      path,
      '', // query string
      canonicalHeaders,
      signedHeaderKeys,
      payloadHash,
    ].join('\n')

    const credentialScope = `${dateStamp}/${this.region}/route53/aws4_request`
    const canonicalRequestHash = await sha256Hex(canonicalRequest)
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

    // Derive signing key
    const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${this.akSecret}`), dateStamp)
    const kRegion = await hmacSha256(kDate, this.region)
    const kService = await hmacSha256(kRegion, 'route53')
    const kSigning = await hmacSha256(kService, 'aws4_request')

    const signature = await hmacSha256Hex(kSigning, stringToSign)

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.akId}/${credentialScope}, SignedHeaders=${signedHeaderKeys}, Signature=${signature}`

    const response = await fetch(url, {
      method,
      headers: { ...headers, 'Authorization': authorization },
      body,
    })

    const text = await response.text()
    if (!response.ok) {
      throw new DnsProviderError(`HTTP ${response.status}: ${text.substring(0, 500)}`, 'aws')
    }

    return { data: text, status: response.status }
  }
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return toHex(hash)
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

async function hmacSha256Hex(key: ArrayBuffer | Uint8Array, data: string): Promise<string> {
  const sig = await hmacSha256(key, data)
  return toHex(sig)
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
