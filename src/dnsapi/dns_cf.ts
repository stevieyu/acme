import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface CloudflareOptions {
  token?: string
  key?: string
  email?: string
}

export class CloudflareProvider extends HttpProviderBase {
  readonly id = 'cf'
  readonly name = 'Cloudflare'

  private readonly token?: string
  private readonly key?: string
  private readonly email?: string

  constructor(options: CloudflareOptions) {
    super('https://api.cloudflare.com/client/v4')
    if (!options.token && (!options.key || !options.email)) {
      throw new DnsProviderError('Either token or key+email required', 'cf')
    }
    this.token = options.token
    this.key = options.key
    this.email = options.email
  }

  protected buildAuthHeaders(): Record<string, string> {
    if (this.token) {
      return { 'Authorization': `Bearer ${this.token}` }
    }
    return {
      'X-Auth-Email': this.email!,
      'X-Auth-Key': this.key!,
    }
  }

  async createTxtRecord(record: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(record.fulldomain)
    this.ctx.logger.debug(`cf: zone ${zoneId} for ${record.fulldomain}`)

    // Check if record already exists
    const existing = await this.findExistingRecord(zoneId, record.fulldomain, record.txtvalue)
    if (existing) {
      this.ctx.logger.debug(`cf: TXT record already exists`)
      return // ponytail: add already exists = success
    }

    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/dns_records`, {
      type: 'TXT',
      name: record.fulldomain,
      content: record.txtvalue,
      ttl: 60,
    })
  }

  async deleteTxtRecord(record: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(record.fulldomain)
    const recordId = await this.findExistingRecord(zoneId, record.fulldomain, record.txtvalue)

    if (!recordId) {
      this.ctx.logger.debug(`cf: TXT record not found, nothing to delete`)
      return // ponytail: rm not found = success
    }

    try {
      await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`)
    } catch {
      // Already deleted or not found
      this.ctx.logger.debug(`cf: delete failed, treating as success`)
    }
  }

  private async findZoneId(domain: string): Promise<string> {
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      try {
        const { data } = await this.request<{ success: boolean; result: Array<{ id: string; name: string }> }>(
          'GET',
          `${this.baseUrl}/zones?name=${encodeURIComponent(candidate)}`,
        )
        if (data.success && data.result.length > 0) {
          return data.result[0]!.id
        }
      } catch {
        // Try next level
      }
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'cf')
  }

  private async findExistingRecord(zoneId: string, name: string, content: string): Promise<string | null> {
    const { data } = await this.request<{
      success: boolean
      result: Array<{ id: string; name: string; content: string }>
    }>(
      'GET',
      `${this.baseUrl}/zones/${zoneId}/dns_records?type=TXT&name=${encodeURIComponent(name)}&content=${encodeURIComponent(content)}`,
    )
    if (data.success && data.result.length > 0) {
      return data.result[0]!.id
    }
    return null
  }
}
