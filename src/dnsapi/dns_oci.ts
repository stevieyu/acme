import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'
import { split2 } from './_util.ts'

export interface OciOptions { tenancyId: string; userId: string; fingerprint: string; privateKey: string; compartmentId: string }
export class OciProvider extends HttpProviderBase {
  readonly id = 'oci'; readonly name = 'Oracle Cloud DNS'
  private readonly tenancyId: string; private readonly userId: string; private readonly fingerprint: string
  private readonly privateKey: string; private readonly compartmentId: string
  constructor(o: OciOptions) {
    super('https://dns.' + 'oci.oraclecloud.com/20180115')
    if (!o.tenancyId || !o.userId || !o.fingerprint || !o.privateKey || !o.compartmentId)
      throw new DnsProviderError('all OCI options required', 'oci')
    this.tenancyId = o.tenancyId; this.userId = o.userId; this.fingerprint = o.fingerprint
    this.privateKey = o.privateKey; this.compartmentId = o.compartmentId
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Signature version="1",keyId="${this.tenancyId}/${this.userId}/${this.fingerprint}",algorithm="rsa-sha256",headers="date (request-target) host content-length content-type x-content-sha256",signature="placeholder"` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('PATCH', `${this.baseUrl}/zones/${domain}/records`, { items: [{ domain: r.fulldomain, rtype: 'TXT', rdata: `"${r.txtvalue}"`, ttl: 300 }], compartmentId: this.compartmentId })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/${r.fulldomain}/TXT`) } catch {}
  }
}
