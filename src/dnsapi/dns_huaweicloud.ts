import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface HuaweicloudOptions { accessKeyId: string; secretAccessKey: string }
export class HuaweicloudProvider extends HttpProviderBase {
  readonly id = 'huaweicloud'; readonly name = 'Huawei Cloud DNS'
  private readonly akId: string
  constructor(o: HuaweicloudOptions) {
    super('https://dns.myhuaweicloud.com/v2')
    if (!o.accessKeyId || !o.secretAccessKey) throw new DnsProviderError('accessKeyId and secretAccessKey required', 'huaweicloud')
    this.akId = o.accessKeyId
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.akId } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const zoneId = await this.findZoneId(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${zoneId}/recordsets`, { name: `${r.fulldomain}.`, type: 'TXT', records: [`"${r.txtvalue}"`], ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const zoneId = await this.findZoneId(r.fulldomain)
      const { data } = await this.request<{ recordsets: Array<{ id: string; records: string[] }> }>('GET', `${this.baseUrl}/zones/${zoneId}/recordsets?type=TXT`)
      const m = data.recordsets?.find((x: { records: string[] }) => x.records.includes(`"${r.txtvalue}"`))
      if (m) await this.request('DELETE', `${this.baseUrl}/zones/${zoneId}/recordsets/${m.id}`)
    } catch {}
  }
  private async findZoneId(domain: string): Promise<string> {
    const { data } = await this.request<{ zones: Array<{ id: string; name: string }> }>('GET', `${this.baseUrl}/zones`)
    const zones = data.zones ?? []
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const c = parts.slice(i).join('.')
      const m = zones.find(z => z.name === `${c}.`)
      if (m) return m.id
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, 'huaweicloud')
  }
}
