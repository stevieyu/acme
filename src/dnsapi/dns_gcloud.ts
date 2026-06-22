import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface GcloudOptions { projectId: string; serviceAccountKey: string }
export class GcloudProvider extends HttpProviderBase {
  readonly id = 'gcloud'; readonly name = 'Google Cloud DNS'
  private readonly projectId: string; private readonly saKey: string; private accessToken = ''
  constructor(o: GcloudOptions) {
    super('https://dns.googleapis.com/dns/v1')
    if (!o.projectId || !o.serviceAccountKey) throw new DnsProviderError('projectId and serviceAccountKey required', 'gcloud')
    this.projectId = o.projectId; this.saKey = o.serviceAccountKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.accessToken}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    const zoneId = await this.fz(domain)
    await this.request('POST', `${this.baseUrl}/projects/${this.projectId}/managedZones/${zoneId}/rrsets`, {
      kind: 'dns#resourceRecordSet', name: `${r.fulldomain}.`, type: 'TXT', ttl: 300, rrdatas: [`"${r.txtvalue}"`],
    })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try {
      const zoneId = await this.fz(domain)
      await this.request('DELETE', `${this.baseUrl}/projects/${this.projectId}/managedZones/${zoneId}/rrsets/${r.fulldomain}./TXT`)
    } catch {}
  }
  private async fz(d: string): Promise<string> {
    const { data } = await this.request<{ managedZones: Array<{ id: string; dnsName: string }> }>('GET', `${this.baseUrl}/projects/${this.projectId}/managedZones`)
    const zones = data.managedZones ?? []
    const parts = d.split('.')
    for (let i = 0; i < parts.length - 1; i++) { const c = parts.slice(i).join('.'); const m = zones.find(z => z.dnsName === `${c}.`); if (m) return m.id }
    throw new DnsProviderError(`zone not found for ${d}`, 'gcloud')
  }
}
