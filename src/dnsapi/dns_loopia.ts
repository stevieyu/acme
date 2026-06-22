import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface LoopiaOptions { user: string; password: string }
export class LoopiaProvider extends HttpProviderBase {
  readonly id = 'loopia'; readonly name = 'Loopia DNS'
  private readonly auth: string
  constructor(options: LoopiaOptions) {
    super('https://api.loopia.se/RPCSERV')
    if (!options.user || !options.password) throw new DnsProviderError('user and password required', 'loopia')
    this.auth = `Basic ${btoa(`${options.user}:${options.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }

  private async loopiaCall(method: string, params: unknown[]): Promise<unknown> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': this.auth },
      body: JSON.stringify({ method, params }),
    })
    const data = await response.json()
    if (!response.ok) throw new DnsProviderError(`Loopia error: ${JSON.stringify(data)}`, 'loopia')
    return data
  }

  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.loopiaCall('addZoneRecord', [this.auth, domain, sub, { type: 'TXT', data: r.txtvalue, ttl: 300 }])
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const records = await this.loopiaCall('getZoneRecords', [this.auth, domain, sub]) as Array<{ record_id: number; data: string }>
      const m = (records ?? []).find((x: { data: string }) => x.data === r.txtvalue)
      if (m) await this.loopiaCall('removeZoneRecord', [this.auth, domain, sub, m.record_id])
    } catch {}
  }
}
