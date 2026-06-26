import { HttpProviderBase } from './base-http.ts'
import type { TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { split2 } from './_util.ts'

export interface QiniuOptions { accessKey: string; secretKey: string }
export class QiniuProvider extends HttpProviderBase {
  readonly id = 'qiniu'; readonly name = 'Qiniu DNS'
  private readonly accessKey: string
  constructor(o: QiniuOptions) {
    super('https://api.qiniu.com')
    if (!o.accessKey || !o.secretKey) throw new DnsProviderError('accessKey and secretKey required', 'qiniu')
    this.accessKey = o.accessKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `UpToken ${this.accessKey}` } }
  async createTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { name: sub, type: 'TXT', value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}
