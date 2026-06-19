import { XmlProviderBase } from './base-xml.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface PleskXmlOptions { url: string; user: string; password: string }

export class PleskXmlProvider extends XmlProviderBase {
  readonly id = 'pleskxml'; readonly name = 'Plesk XML-RPC'
  private readonly auth: string

  constructor(options: PleskXmlOptions) {
    super(options.url)
    if (!options.url || !options.user || !options.password)
      throw new DnsProviderError('url, user and password required', 'pleskxml')
    this.auth = `Basic ${btoa(`${options.user}:${options.password}`)}`
  }

  protected buildXmlBody(method: string, params: Record<string, unknown>): string {
    return this.builder.build({
      packet: { dns: { [method]: params } },
    })
  }

  protected parseXmlResponse(xml: string): unknown {
    return this.parser.parse(xml)
  }

  async createTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    const siteId = await this.findSiteId(domain)
    await this.xmlRequest('add_rec', {
      site_id: siteId, type: 'TXT', host: sub, value: r.txtvalue,
    }, { 'Authorization': this.auth })
  }

  async deleteTxtRecord(ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = split2(r.fulldomain)
    try {
      const siteId = await this.findSiteId(domain)
      const result = await this.xmlRequest<Record<string, unknown>>('get_rec', {
        filter: { site_id: siteId, type: 'TXT', host: sub },
      }, { 'Authorization': this.auth })
      const records = extractRecords(result)
      const m = records.find(x => x.value === r.txtvalue)
      if (m) {
        await this.xmlRequest('del_rec', { filter: { id: m.id } }, { 'Authorization': this.auth })
      }
    } catch {}
  }

  private async findSiteId(domain: string): Promise<number> {
    const result = await this.xmlRequest<Record<string, unknown>>('get', {
      filter: { name: domain }, dataset: { gen_info: {} },
    }, { 'Authorization': this.auth })
    const res = (result?.packet as Record<string, unknown>)?.dns as Record<string, unknown> | undefined
    const site = ((res?.get as Record<string, unknown>)?.result as Record<string, unknown>)?.id
    if (site) return Number(site)
    throw new DnsProviderError(`Could not find site for ${domain}`, 'pleskxml')
  }
}

function extractRecords(data: Record<string, unknown>): Array<{ id: number; value: string }> {
  try {
    const packet = data.packet as Record<string, unknown>
    const dns = packet.dns as Record<string, unknown>
    const getRec = dns.get_rec as Record<string, unknown>
    const result = getRec.result as Record<string, unknown>
    const records = result.data as Array<Record<string, unknown>> | Record<string, unknown>
    const arr = Array.isArray(records) ? records : [records]
    return arr.map(r => ({ id: Number(r.id), value: String(r.value ?? '') }))
  } catch {
    return []
  }
}

function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  const domain = parts.slice(-2).join('.')
  const sub = parts.slice(0, -2).join('.')
  return { domain, sub: sub || '@' }
}
