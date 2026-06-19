import { HttpProviderBase } from './base-http.ts'
import type { DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

function s2(fd: string): { domain: string; sub: string } {
  const p = fd.split('.'); if (p.length <= 2) return { domain: fd, sub: '@' }
  return { domain: p.slice(-2).join('.'), sub: p.slice(0, -2).join('.') || '@' }
}

// ─── 1984 ───────────────────────────────────────────────────────
export interface Nineteen84bOptions { token: string }
export class Nineteen84bProvider extends HttpProviderBase {
  readonly id = '1984'; readonly name = '1984'
  private readonly token: string
  constructor(o: Nineteen84bOptions) {
    super('https://api.1984.is/v1')
    if (!o.token) throw new DnsProviderError('token required', '1984')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Acmeproxy ──────────────────────────────────────────────────
export interface AcmeproxyOptions { url: string; username: string; password: string }
export class AcmeproxyProvider extends HttpProviderBase {
  readonly id = 'acmeproxy'; readonly name = 'acme-proxy'
  private readonly auth: string
  constructor(o: AcmeproxyOptions) {
    super(o.url || 'https://localhost')
    if (!o.url || !o.username || !o.password) throw new DnsProviderError('url, username and password required', 'acmeproxy')
    this.auth = `Basic ${btoa(`${o.username}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/present`, { fqdn: r.fulldomain, value: r.txtvalue })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try { await this.request('POST', `${this.baseUrl}/cleanup`, { fqdn: r.fulldomain, value: r.txtvalue }) } catch {}
  }
}

// ─── Ait ────────────────────────────────────────────────────────
export interface AitOptions { apiKey: string }
export class AitProvider extends HttpProviderBase {
  readonly id = 'ait'; readonly name = 'AIT'
  private readonly apiKey: string
  constructor(o: AitOptions) {
    super('https://api.ait.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'ait')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Bytemill ───────────────────────────────────────────────────
export interface BytemillOptions { apiKey: string }
export class BytemillProvider extends HttpProviderBase {
  readonly id = 'bytemill'; readonly name = 'Bytemill'
  private readonly apiKey: string
  constructor(o: BytemillOptions) {
    super('https://api.bytemill.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'bytemill')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Centarra ───────────────────────────────────────────────────
export interface Centarra2Options { token: string }
export class Centarra2Provider extends HttpProviderBase {
  readonly id = 'centarra2'; readonly name = 'Centarra V2'
  private readonly token: string
  constructor(o: Centarra2Options) {
    super('https://api.centarra.com/v2')
    if (!o.token) throw new DnsProviderError('token required', 'centarra2')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── ClouDNS v2 ─────────────────────────────────────────────────
export interface Cloudns2Options { authId: string; authPassword: string }
export class Cloudns2Provider extends HttpProviderBase {
  readonly id = 'cloudns2'; readonly name = 'ClouDNS V2'
  private readonly authId: string; private readonly authPass: string
  constructor(o: Cloudns2Options) {
    super('https://api.cloudns.net')
    if (!o.authId || !o.authPassword) throw new DnsProviderError('authId and authPassword required', 'cloudns2')
    this.authId = o.authId; this.authPass = o.authPassword
  }
  protected buildAuthHeaders(): Record<string, string> { return {} }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/add-record.json`, { 'auth-id': this.authId, 'auth-password': this.authPass, domain_name: domain, record_type: 'TXT', host: sub, record: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const { data } = await this.request<Record<string, { id: string; record: string }>>('GET', `${this.baseUrl}/dns/records.json?auth-id=${this.authId}&auth-password=${this.authPass}&domain-name=${domain}&type=TXT`)
      const list = Object.values(data)
      const m = list.find((x: { record: string }) => x.record === r.txtvalue)
      if (m) await this.request('POST', `${this.baseUrl}/dns/delete-record.json`, { 'auth-id': this.authId, 'auth-password': this.authPass, domain_name: domain, record_id: m.id })
    } catch {}
  }
}

// ─── DF.eu ──────────────────────────────────────────────────────
export interface DfeuOptions { token: string }
export class DfeuProvider extends HttpProviderBase {
  readonly id = 'df'; readonly name = 'DF.eu'
  private readonly token: string
  constructor(o: DfeuOptions) {
    super('https://api.df.eu/v1')
    if (!o.token) throw new DnsProviderError('token required', 'df')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── DNSServices ────────────────────────────────────────────────
export interface DnsservicesOptions { user: string; password: string }
export class DnsservicesProvider extends HttpProviderBase {
  readonly id = 'dnsservices'; readonly name = 'DNS Services'
  private readonly auth: string
  constructor(o: DnsservicesOptions) {
    super('https://dns.services/api')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'dnsservices')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/zones/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/zones/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Doho ───────────────────────────────────────────────────────
export interface DohoOptions { user: string; password: string }
export class DohoProvider extends HttpProviderBase {
  readonly id = 'doho'; readonly name = 'DoHo'
  private readonly auth: string
  constructor(o: DohoOptions) {
    super('https://api.doho.com/v1')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'doho')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Furnas ─────────────────────────────────────────────────────
export interface FurnasOptions { apiKey: string }
export class FurnasProvider extends HttpProviderBase {
  readonly id = 'furnas'; readonly name = 'Furnas'
  private readonly apiKey: string
  constructor(o: FurnasOptions) {
    super('https://api.furnas.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'furnas')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── HostingBe ──────────────────────────────────────────────────
export interface HostingbeOptions { apiKey: string }
export class HostingbeProvider extends HttpProviderBase {
  readonly id = 'hostingbe'; readonly name = 'HostingBE'
  private readonly apiKey: string
  constructor(o: HostingbeOptions) {
    super('https://api.hostingbe.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'hostingbe')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Ilkera ─────────────────────────────────────────────────────
export interface IlkeraOptions { apiKey: string }
export class IlkeraProvider extends HttpProviderBase {
  readonly id = 'ilkera'; readonly name = 'Ilkera'
  private readonly apiKey: string
  constructor(o: IlkeraOptions) {
    super('https://api.ilkera.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'ilkera')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Infoblox ───────────────────────────────────────────────────
export interface InfobloxOptions { url: string; user: string; password: string }
export class InfobloxProvider extends HttpProviderBase {
  readonly id = 'infoblox'; readonly name = 'Infoblox'
  private readonly auth: string
  constructor(o: InfobloxOptions) {
    super(o.url || 'https://localhost/wapi/v2.10')
    if (!o.url || !o.user || !o.password) throw new DnsProviderError('url, user and password required', 'infoblox')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    await this.request('POST', `${this.baseUrl}/record:txt`, { name: r.fulldomain, text: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const { data } = await this.request<Array<{ _ref: string; text: string }>>('GET', `${this.baseUrl}/record:txt?name=${r.fulldomain}`)
      const list = Array.isArray(data) ? data : []
      const m = list.find((x: { text: string }) => x.text === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/${m._ref}`)
    } catch {}
  }
}

// ─── Jiyou ──────────────────────────────────────────────────────
export interface JiyouOptions { apiKey: string }
export class JiyouProvider extends HttpProviderBase {
  readonly id = 'jiyou'; readonly name = 'Jiyou'
  private readonly apiKey: string
  constructor(o: JiyouOptions) {
    super('https://api.jiyou.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'jiyou')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Kappernet ──────────────────────────────────────────────────
export interface KappernetOptions { apiKey: string }
export class KappernetProvider extends HttpProviderBase {
  readonly id = 'kappernet'; readonly name = 'Kappernet'
  private readonly apiKey: string
  constructor(o: KappernetOptions) {
    super('https://api.kappernet.org/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'kappernet')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── KX ─────────────────────────────────────────────────────────
export interface KxOptions { apiKey: string }
export class KxProvider extends HttpProviderBase {
  readonly id = 'kx'; readonly name = 'KX DNS'
  private readonly apiKey: string
  constructor(o: KxOptions) {
    super('https://api.kx.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'kx')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── MagicDns ───────────────────────────────────────────────────
export interface MagicdnsOptions { apiKey: string }
export class MagicdnsProvider extends HttpProviderBase {
  readonly id = 'magicdns'; readonly name = 'MagicDNS'
  private readonly apiKey: string
  constructor(o: MagicdnsOptions) {
    super('https://api.magicdns.org/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'magicdns')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── MailRu ─────────────────────────────────────────────────────
export interface MailruOptions { token: string }
export class MailruProvider extends HttpProviderBase {
  readonly id = 'mailru'; readonly name = 'Mail.ru Cloud'
  private readonly token: string
  constructor(o: MailruOptions) {
    super('https://cloud.mail.ru/api/v2')
    if (!o.token) throw new DnsProviderError('token required', 'mailru')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Mandant ────────────────────────────────────────────────────
export interface MandantOptions { token: string }
export class MandantProvider extends HttpProviderBase {
  readonly id = 'mandant'; readonly name = 'Mandant'
  private readonly token: string
  constructor(o: MandantOptions) {
    super('https://api.mandant.net/v1')
    if (!o.token) throw new DnsProviderError('token required', 'mandant')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── MIT ────────────────────────────────────────────────────────
export interface MitOptions { apiKey: string }
export class MitProvider extends HttpProviderBase {
  readonly id = 'mit'; readonly name = 'MIT DNS'
  private readonly apiKey: string
  constructor(o: MitOptions) {
    super('https://api.mit.edu/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'mit')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Moe ────────────────────────────────────────────────────────
export interface MoeOptions { apiKey: string }
export class MoeProvider extends HttpProviderBase {
  readonly id = 'moe'; readonly name = 'Moe DNS'
  private readonly apiKey: string
  constructor(o: MoeOptions) {
    super('https://api.moe.computer/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'moe')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Mozilla ────────────────────────────────────────────────────
export interface MozillaOptions { apiKey: string }
export class MozillaProvider extends HttpProviderBase {
  readonly id = 'mozilla'; readonly name = 'Mozilla DNS'
  private readonly apiKey: string
  constructor(o: MozillaOptions) {
    super('https://api.mozilla.io/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'mozilla')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── MyDevil ────────────────────────────────────────────────────
export interface MydevilOptions { user: string; password: string }
export class MydevilProvider extends HttpProviderBase {
  readonly id = 'mydevil'; readonly name = 'MyDevil'
  private readonly auth: string
  constructor(o: MydevilOptions) {
    super('https://api.mydevil.net/v1')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'mydevil')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── MyDnsJp ────────────────────────────────────────────────────
export interface MydnsjpOptions { user: string; password: string }
export class MydnsjpProvider extends HttpProviderBase {
  readonly id = 'mydnsjp'; readonly name = 'MyDNS.jp'
  private readonly auth: string
  constructor(o: MydnsjpOptions) {
    super('https://www.mydns.jp')
    if (!o.user || !o.password) throw new DnsProviderError('user and password required', 'mydnsjp')
    this.auth = `Basic ${btoa(`${o.user}:${o.password}`)}`
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': this.auth } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const params = new URLSearchParams({ hostname: r.fulldomain, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/api/?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    try {
      const params = new URLSearchParams({ hostname: r.fulldomain, type: 'TXT', content: '', ttl: '300', delete: '1' })
      await fetch(`${this.baseUrl}/api/?${params}`, { headers: this.buildAuthHeaders() })
    } catch {}
  }
}

// ─── NW (Nwps) ──────────────────────────────────────────────────
export interface NwOptions { apiKey: string }
export class NwProvider extends HttpProviderBase {
  readonly id = 'nw'; readonly name = 'NW'
  private readonly apiKey: string
  constructor(o: NwOptions) {
    super('https://api.nw.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'nw')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Online ─────────────────────────────────────────────────────
export interface OnlineOptions { token: string }
export class OnlineProvider extends HttpProviderBase {
  readonly id = 'online'; readonly name = 'Online.net'
  private readonly token: string
  constructor(o: OnlineOptions) {
    super('https://api.online.net/v1')
    if (!o.token) throw new DnsProviderError('token required', 'online')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Opends ─────────────────────────────────────────────────────
export interface OpendsOptions { apiKey: string }
export class OpendsProvider extends HttpProviderBase {
  readonly id = 'opends'; readonly name = 'OpenDS'
  private readonly apiKey: string
  constructor(o: OpendsOptions) {
    super('https://api.opends.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'opends')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Parkingcrew ────────────────────────────────────────────────
export interface ParkingcrewOptions { token: string }
export class ParkingcrewProvider extends HttpProviderBase {
  readonly id = 'parkingcrew'; readonly name = 'ParkingCrew'
  private readonly token: string
  constructor(o: ParkingcrewOptions) {
    super('https://api.parkingcrew.net/v1')
    if (!o.token) throw new DnsProviderError('token required', 'parkingcrew')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── PDD (Yandex) ──────────────────────────────────────────────
export interface PddOptions { token: string }
export class PddProvider extends HttpProviderBase {
  readonly id = 'pdd'; readonly name = 'Yandex PDD'
  private readonly token: string
  constructor(o: PddOptions) {
    super('https://pddimp.yandex.ru/api2')
    if (!o.token) throw new DnsProviderError('token required', 'pdd')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'PddToken': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    const params = new URLSearchParams({ domain, subdomain: sub, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/admin/dns/add?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const params = new URLSearchParams({ domain })
      const resp = await fetch(`${this.baseUrl}/admin/dns/list?${params}`, { headers: this.buildAuthHeaders() })
      const data = await resp.json() as Record<string, unknown>
      const records = (data.records as Array<{ record_id: number; content: string }> | undefined) ?? []
      const m = records.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) {
        const dp = new URLSearchParams({ domain, record_id: String(m.record_id) })
        await fetch(`${this.baseUrl}/admin/dns/del?${dp}`, { headers: this.buildAuthHeaders() })
      }
    } catch {}
  }
}

// ─── Pear ───────────────────────────────────────────────────────
export interface PearOptions { apiKey: string }
export class PearProvider extends HttpProviderBase {
  readonly id = 'pear'; readonly name = 'Pear'
  private readonly apiKey: string
  constructor(o: PearOptions) {
    super('https://api.pear.host/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'pear')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Py (Python) ────────────────────────────────────────────────
export interface PyOptions { apiKey: string }
export class PyProvider extends HttpProviderBase {
  readonly id = 'py'; readonly name = 'Py DNS'
  private readonly apiKey: string
  constructor(o: PyOptions) {
    super('https://api.pydns.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'py')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Ru ─────────────────────────────────────────────────────────
export interface RuOptions { apiKey: string }
export class RuProvider extends HttpProviderBase {
  readonly id = 'ru'; readonly name = 'RU DNS'
  private readonly apiKey: string
  constructor(o: RuOptions) {
    super('https://api.nic.ru/dns')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'ru')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `Bearer ${this.apiKey}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('PUT', `${this.baseUrl}/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Schlund ────────────────────────────────────────────────────
export interface SchlundOptions { token: string }
export class SchlundProvider extends HttpProviderBase {
  readonly id = 'schlund'; readonly name = 'Schlund'
  private readonly token: string
  constructor(o: SchlundOptions) {
    super('https://api.schlund.de/v1')
    if (!o.token) throw new DnsProviderError('token required', 'schlund')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Auth-Token': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, value: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Sit ────────────────────────────────────────────────────────
export interface SitOptions { apiKey: string }
export class SitProvider extends HttpProviderBase {
  readonly id = 'sit'; readonly name = 'Sit DNS'
  private readonly apiKey: string
  constructor(o: SitOptions) {
    super('https://api.sitdns.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'sit')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Uno ────────────────────────────────────────────────────────
export interface UnoOptions { apiKey: string }
export class UnoProvider extends HttpProviderBase {
  readonly id = 'uno'; readonly name = 'Uno DNS'
  private readonly apiKey: string
  constructor(o: UnoOptions) {
    super('https://api.unodns.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'uno')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Us ─────────────────────────────────────────────────────────
export interface UsOptions { apiKey: string }
export class UsProvider extends HttpProviderBase {
  readonly id = 'us'; readonly name = 'US DNS'
  private readonly apiKey: string
  constructor(o: UsOptions) {
    super('https://api.usdns.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'us')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Variomedia ─────────────────────────────────────────────────
export interface VariomediaOptions { token: string }
export class VariomediaProvider extends HttpProviderBase {
  readonly id = 'variomedia'; readonly name = 'Variomedia'
  private readonly token: string
  constructor(o: VariomediaOptions) {
    super('https://api.variomedia.de/dns')
    if (!o.token) throw new DnsProviderError('token required', 'variomedia')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'Authorization': `token ${this.token}` } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/records`, { data: { type: 'dns-record', attributes: { record_type: 'TXT', name: sub, data: r.txtvalue, ttl: 300, zone_id: domain } } })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const { data } = await this.request<{ data: Array<{ id: string; attributes: { data: string } }> }>('GET', `${this.baseUrl}/records?zone=${domain}&type=TXT`)
      const list = data.data ?? []
      const m = list.find((x: { attributes: { data: string } }) => x.attributes.data === r.txtvalue)
      if (m) await this.request('DELETE', `${this.baseUrl}/records/${m.id}`)
    } catch {}
  }
}

// ─── Vscale ─────────────────────────────────────────────────────
export interface VscaleOptions { token: string }
export class VscaleProvider extends HttpProviderBase {
  readonly id = 'vscale'; readonly name = 'Vscale'
  private readonly token: string
  constructor(o: VscaleOptions) {
    super('https://api.vscale.io/v1')
    if (!o.token) throw new DnsProviderError('token required', 'vscale')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-Token': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/domains/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/domains/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── World4you ──────────────────────────────────────────────────
export interface World4youOptions { apiKey: string }
export class World4youProvider extends HttpProviderBase {
  readonly id = 'world4you'; readonly name = 'World4You'
  private readonly apiKey: string
  constructor(o: World4youOptions) {
    super('https://api.world4you.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'world4you')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}

// ─── Yandex ─────────────────────────────────────────────────────
export interface YandexOptions { token: string }
export class YandexProvider extends HttpProviderBase {
  readonly id = 'yandex'; readonly name = 'Yandex DNS'
  private readonly token: string
  constructor(o: YandexOptions) {
    super('https://pddimp.yandex.ru/api2')
    if (!o.token) throw new DnsProviderError('token required', 'yandex')
    this.token = o.token
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'PddToken': this.token } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    const params = new URLSearchParams({ domain, subdomain: sub, type: 'TXT', content: r.txtvalue, ttl: '300' })
    await fetch(`${this.baseUrl}/admin/dns/add?${params}`, { headers: this.buildAuthHeaders() })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain } = s2(r.fulldomain)
    try {
      const resp = await fetch(`${this.baseUrl}/admin/dns/list?domain=${domain}`, { headers: this.buildAuthHeaders() })
      const data = await resp.json() as Record<string, unknown>
      const records = (data.records as Array<{ record_id: number; content: string }> | undefined) ?? []
      const m = records.find((x: { content: string }) => x.content === r.txtvalue)
      if (m) {
        const dp = new URLSearchParams({ domain, record_id: String(m.record_id) })
        await fetch(`${this.baseUrl}/admin/dns/del?${dp}`, { headers: this.buildAuthHeaders() })
      }
    } catch {}
  }
}

// ─── Zeru ───────────────────────────────────────────────────────
export interface ZeruOptions { apiKey: string }
export class ZeruProvider extends HttpProviderBase {
  readonly id = 'zeru'; readonly name = 'Zeru'
  private readonly apiKey: string
  constructor(o: ZeruOptions) {
    super('https://api.zeru.com/v1')
    if (!o.apiKey) throw new DnsProviderError('apiKey required', 'zeru')
    this.apiKey = o.apiKey
  }
  protected buildAuthHeaders(): Record<string, string> { return { 'X-API-Key': this.apiKey } }
  async createTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    await this.request('POST', `${this.baseUrl}/dns/${domain}/records`, { type: 'TXT', name: sub, content: r.txtvalue, ttl: 300 })
  }
  async deleteTxtRecord(_ctx: DnsProviderContext, r: TxtRecordInput): Promise<void> {
    const { domain, sub } = s2(r.fulldomain)
    try { await this.request('DELETE', `${this.baseUrl}/dns/${domain}/records/TXT/${sub}`) } catch {}
  }
}
