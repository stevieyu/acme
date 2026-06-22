import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface NetcupOptions { apiKey: string; apiPassword: string; customerId: string }
export class NetcupProvider extends HttpProviderBase {
  readonly id = 'netcup'; readonly name = 'Netcup'
  private readonly apiKey: string; private readonly apiPassword: string; private readonly customerId: string; private sessionId = ''
  constructor(o: NetcupOptions) {
    super('https://ccp.netcup.net/run/webservice/servers/endpoint.php?JSON')
    if (!o.apiKey || !o.apiPassword || !o.customerId) throw new DnsProviderError('apiKey, apiPassword and customerId required', 'netcup')
    this.apiKey = o.apiKey; this.apiPassword = o.apiPassword; this.customerId = o.customerId
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  private async ncCall(action: string, params: Record<string, unknown>): Promise<unknown> {
    const { data } = await this.request<{ responsedata: Record<string, unknown> }>('POST', this.baseUrl, { action, param: { ...params, apikey: this.apiKey, apisessionid: this.sessionId } })
    return data.responsedata
  }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    if (!this.sessionId) {
      const result = await this.ncCall('login', { customernumber: this.customerId, apipassword: this.apiPassword }) as Record<string, string>
      this.sessionId = result.apisessionid ?? ''
    }
    const { domain, sub } = split2(r.fulldomain)
    await this.ncCall('updateDnsRecords', { domainname: domain, dnsrecordset: { dns_records: [{ hostname: sub, type: 'TXT', destination: r.txtvalue, ttl: 300 }] } })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    try {
      const { domain, sub } = split2(r.fulldomain)
      await this.ncCall('updateDnsRecords', { domainname: domain, dnsrecordset: { dns_records: [{ hostname: sub, type: 'TXT', destination: r.txtvalue, delete: true }] } })
    } catch {}
  }
}
