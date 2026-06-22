import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface HetznerOptions { token: string }

export class HetznerProvider extends HttpProviderBase {
  readonly id = 'hetzner'
  readonly name = 'Hetzner DNS'
  private readonly token: string

  constructor(options: HetznerOptions) {
    super('https://dns.hetzner.com/api/v1')
    if (!options.token) throw new DnsProviderError('token required', 'hetzner')
    this.token = options.token
  }

  protected buildAuthHeaders(): Record<string, string> {
    return { 'Auth-Token': this.token }
  }

  async createTxtRecord(record: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(record.fulldomain)
    const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>(
      'GET', `${this.baseUrl}/records?zone_id=${zoneId}`,
    )
    if (data.records?.some(r => r.value === record.txtvalue)) {
      this.ctx.logger.debug('hetzner: TXT already exists')
      return
    }
    const name = record.fulldomain.replace(`.${await this.getZoneName(zoneId)}`, '')
    await this.request('POST', `${this.baseUrl}/records`, {
      type: 'TXT', name, value: record.txtvalue, ttl: 60, zone_id: zoneId,
    })
  }

  async deleteTxtRecord(record: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(record.fulldomain)
    const { data } = await this.request<{ records: Array<{ id: string; value: string }> }>(
      'GET', `${this.baseUrl}/records?zone_id=${zoneId}`,
    )
    const match = data.records?.find(r => r.value === record.txtvalue)
    if (!match) return
    try { await this.request('DELETE', `${this.baseUrl}/records/${match.id}`) } catch {}
  }

  private zoneNameCache = new Map<string, string>()

  private async getZoneName(zoneId: string): Promise<string> {
    if (this.zoneNameCache.has(zoneId)) return this.zoneNameCache.get(zoneId)!
    const { data } = await this.request<{ zone: { name: string } }>('GET', `${this.baseUrl}/zones/${zoneId}`)
    this.zoneNameCache.set(zoneId, data.zone.name)
    return data.zone.name
  }

  private async findZoneId(domain: string): Promise<string> {
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      try {
        const { data } = await this.request<{ zones: Array<{ id: string; name: string }> }>(
          'GET', `${this.baseUrl}/zones?name=${encodeURIComponent(candidate)}`,
        )
        if (data.zones?.length > 0) {
          this.zoneNameCache.set(data.zones[0]!.id, data.zones[0]!.name)
          return data.zones[0]!.id
        }
      } catch {}
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'hetzner')
  }
}
