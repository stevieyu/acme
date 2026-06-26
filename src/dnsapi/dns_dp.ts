import { HmacProviderBase } from './base-hmac.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export interface DnspodOptions {
  id: string
  key: string
}

export class DnspodProvider extends HmacProviderBase {
  readonly id = 'dp'
  readonly name = 'DNSPod'

  private readonly dpId: string
  private readonly dpKey: string

  constructor(options: DnspodOptions) {
    super('https://dnsapi.cn')
    if (!options.id || !options.key) {
      throw new DnsProviderError('id and key required', 'dp')
    }
    this.dpId = options.id
    this.dpKey = options.key
  }

  protected async buildSignedHeaders(): Promise<Record<string, string>> {
    return { 'Content-Type': 'application/x-www-form-urlencoded' }
  }

  private async dpRequest(params: Record<string, string>): Promise<Record<string, unknown>> {
    const body = new URLSearchParams({
      login_token: `${this.dpId},${this.dpKey}`,
      format: 'json',
      ...params,
    })

    const response = await fetch(`${this.baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json() as Record<string, unknown>
    const status = data.status as { code?: string; message?: string } | undefined
    if (status?.code !== '1') {
      throw new DnsProviderError(`API error: ${status?.message ?? JSON.stringify(data)}`, 'dp')
    }
    return data
  }

  async createTxtRecord(record: TxtRecordInput): Promise<void> {
    const { domain, subDomain } = splitDomain(record.fulldomain)
    this.ctx.logger.debug(`dp: creating TXT ${subDomain}.${domain} = ${record.txtvalue}`)

    await this.dpRequest({
      domain,
      sub_domain: subDomain,
      record_type: 'TXT',
      record_line: '默认',
      value: record.txtvalue,
      ttl: '600',
    })
  }

  async deleteTxtRecord(record: TxtRecordInput): Promise<void> {
    const { domain, subDomain } = splitDomain(record.fulldomain)
    this.ctx.logger.debug(`dp: deleting TXT ${subDomain}.${domain}`)

    // List records to find matching one
    const data = await this.dpRequest({
      domain,
      subdomain: subDomain,
      record_type: 'TXT',
    })

    const records = (data.records ?? []) as Array<{ id: string; value: string; name: string }>
    const match = records.find(r => r.value === record.txtvalue)

    if (!match) {
      this.ctx.logger.debug(`dp: TXT record not found, nothing to delete`)
      return // ponytail: rm not found = success
    }

    try {
      await this.dpRequest({
        domain,
        record_id: match.id,
      })
    } catch {
      this.ctx.logger.debug(`dp: delete failed, treating as success`)
    }
  }
}

function splitDomain(fulldomain: string): { domain: string; subDomain: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) {
    return { domain: fulldomain, subDomain: '@' }
  }
  const domain = parts.slice(-2).join('.')
  const subDomain = parts.slice(0, -2).join('.')
  return { domain, subDomain: subDomain || '@' }
}
