import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface InwxOptions { user: string; password: string }
export class InwxProvider extends HttpProviderBase {
  readonly id = 'inwx'; readonly name = 'INWX'
  private readonly user: string
  private readonly password: string
  constructor(options: InwxOptions) {
    super('https://api.domrobot.com/xmlrpc/')
    if (!options.user || !options.password) throw new DnsProviderError('user and password required', 'inwx')
    this.user = options.user
    this.password = options.password
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }

  private async inwxCall(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${this.user}:${this.password}`)}`,
    }
    const response = await fetch(this.baseUrl, {
      method: 'POST', headers,
      body: JSON.stringify({ method, params }),
    })
    const data = await response.json() as Record<string, unknown>
    const result = data.result as Record<string, unknown> | undefined
    if (result?.code && Number(result.code) !== 1000) {
      throw new DnsProviderError(`INWX error ${result.code}: ${result.msg ?? ''}`, 'inwx')
    }
    return result ?? {}
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.inwxCall('nameserver.createRecord', { domain, name: sub, type: 'TXT', content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const result = await this.inwxCall('nameserver.info', { domain, name: sub, type: 'TXT' })
      const records = ((result.record ?? []) as Array<{ id: number; content: string }>)
      const m = records.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) await this.inwxCall('nameserver.deleteRecord', { id: m.id })
    } catch {}
  }
}
