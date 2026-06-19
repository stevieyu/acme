import type { DnsProvider } from './types.ts'

// ─── Individual providers ────────────────────────────────────────
import { CloudflareProvider, type CloudflareOptions } from './cf.ts'
import { DnspodProvider, type DnspodOptions } from './dp.ts'
import { AliyunProvider, type AliyunOptions } from './ali.ts'
import { AwsRoute53Provider, type AwsOptions } from './aws.ts'
import { HetznerProvider, type HetznerOptions } from './hetzner.ts'
import { PleskXmlProvider, type PleskXmlOptions } from './pleskxml.ts'

// ─── Batch files ─────────────────────────────────────────────────
import * as BHttp from './batch-http.ts'
import * as BHmac from './batch-hmac.ts'
import * as BHttp2 from './batch-http2.ts'
import * as BB from './batch-b.ts'
import * as BC from './batch-c.ts'
import * as BD from './batch-d.ts'
import * as BD2 from './batch-d2.ts'

export type ProviderId =
  | 'cf' | 'dp' | 'ali' | 'aws' | 'hetzner' | 'pleskxml'
  // batch-http
  | 'vultr' | 'dgon' | 'linode_v4' | 'gandi_livedns' | 'desec' | 'gcore' | 'gd' | 'ionos'
  // batch-hmac
  | 'tencent' | 'baidu' | 'jd' | 'edgedns' | 'constellix'
  // batch-http2
  | 'doapi' | 'namecheap' | 'namesilo' | 'ovh' | 'inwx' | 'loopia'
  // batch-b
  | 'me' | 'active24' | 'aurora' | 'exoscale' | 'websupport'
  // batch-c
  | 'porkbun' | 'bunny' | 'cloudns' | 'dynu' | 'acmedns' | 'dreamhost' | 'freedns'
  | 'njalla' | 'netlify' | 'vercel' | 'transip' | 'scaleway' | 'infomaniak'
  | 'selectel' | 'spaceship' | 'zonomi' | 'rackspace' | 'hetznercloud'
  | 'oci' | 'huaweicloud' | 'dyn' | 'simply' | 'timeweb' | 'leaseweb'
  | 'hostup' | 'internetbs' | 'regru' | 'veesp' | 'zilore' | 'zone'
  // batch-d
  | '1984hosting' | 'arvan' | 'autodns' | 'cx' | 'cpanel' | 'ddnss'
  | 'dnsimple' | 'dnsmadeeasy' | 'dominion' | 'durabledns' | 'dynv6'
  | 'easydns' | 'euserv' | 'futurecms' | 'gcloud' | 'he' | 'joker'
  | 'kinghost' | 'knot' | 'luadns' | 'mythic' | 'namecom' | 'natro'
  | 'netcup' | 'nsone' | 'one' | 'pantheon' | 'pdns' | 'qiniu'
  | 'rage4' | 'selfhost' | 'servercow' | 'sedo' | 'allinkl' | 'conoha'
  | 'centarra' | 'kapper' | 'nederhost' | 'ispconfig'
  // batch-d2
  | '1984' | 'acmeproxy' | 'ait' | 'bytemill' | 'centarra2' | 'cloudns2'
  | 'df' | 'dnsservices' | 'doho' | 'furnas' | 'hostingbe' | 'ilkera'
  | 'infoblox' | 'jiyou' | 'kappernet' | 'kx' | 'magicdns' | 'mailru'
  | 'mandant' | 'mit' | 'moe' | 'mozilla' | 'mydevil' | 'mydnsjp'
  | 'nw' | 'online' | 'opends' | 'parkingcrew' | 'pdd' | 'pear'
  | 'py' | 'ru' | 'schlund' | 'sit' | 'uno' | 'us' | 'variomedia'
  | 'vscale' | 'world4you' | 'yandex' | 'zeru'

type Opts = unknown

interface ProviderOptionsMap {
  cf: CloudflareOptions; dp: DnspodOptions; ali: AliyunOptions; aws: AwsOptions
  hetzner: HetznerOptions; pleskxml: PleskXmlOptions
  vultr: BHttp.VultrOptions; dgon: BHttp.DgonOptions; linode_v4: BHttp.LinodeV4Options
  gandi_livedns: BHttp.GandiLiveDnsOptions; desec: BHttp.DesecOptions
  gcore: BHttp.GcoreOptions; gd: BHttp.GdOptions; ionos: BHttp.IonosOptions
  tencent: BHmac.TencentOptions; baidu: BHmac.BaiduOptions; jd: BHmac.JdOptions
  edgedns: BHmac.EdgednsOptions; constellix: BHmac.ConstellixOptions
  doapi: BHttp2.DoapiOptions; namecheap: BHttp2.NamecheapOptions
  namesilo: BHttp2.NamesiloOptions; ovh: BHttp2.OvhOptions
  inwx: BHttp2.InwxOptions; loopia: BHttp2.LoopiaOptions
  me: BB.MeOptions; active24: BB.Active24Options; aurora: BB.AuroraOptions
  exoscale: BB.ExoscaleOptions; websupport: BB.WebsupportOptions
  porkbun: BC.PorkbunOptions; bunny: BC.BunnyOptions; cloudns: BC.CloudnsOptions
  dynu: BC.DynuOptions; acmedns: BC.AcmednsOptions; dreamhost: BC.DreamhostOptions
  freedns: BC.FreednsOptions; njalla: BC.NjallaOptions; netlify: BC.NetlifyOptions
  vercel: BC.VercelOptions; transip: BC.TransipOptions; scaleway: BC.ScalewayOptions
  infomaniak: BC.InfomaniakOptions; selectel: BC.SelectelOptions
  spaceship: BC.SpaceshipOptions; zonomi: BC.ZonomiOptions
  rackspace: BC.RackspaceOptions; hetznercloud: BC.HetznercloudOptions
  oci: BC.OciOptions; huaweicloud: BC.HuaweicloudOptions; dyn: BC.DynOptions
  simply: BC.SimplyOptions; timeweb: BC.TimewebOptions; leaseweb: BC.LeasewebOptions
  hostup: BC.HostupOptions; internetbs: BC.InternetbsOptions; regru: BC.RegruOptions
  veesp: BC.VeespOptions; zilore: BC.ZiloreOptions; zone: BC.ZoneOptions
  '1984hosting': BD.Nineteen84Options; arvan: BD.ArvanOptions
  autodns: BD.AutodnsOptions; cx: BD.CloudxOptions; cpanel: BD.CpanelOptions
  ddnss: BD.DdnssOptions; dnsimple: BD.DnsimpleOptions
  dnsmadeeasy: BD.DnsmadeeasyOptions; dominion: BD.DominionOptions
  durabledns: BD.DurablednsOptions; dynv6: BD.Dynv6Options
  easydns: BD.EasydnsOptions; euserv: BD.EuservOptions
  futurecms: BD.FuturecmsOptions; gcloud: BD.GcloudOptions
  he: BD.HeOptions; joker: BD.JokerOptions; kinghost: BD.KinghostOptions
  knot: BD.KnotOptions; luadns: BD.LuadnsOptions; mythic: BD.MythicOptions
  namecom: BD.NamecomOptions; natro: BD.NatroOptions
  netcup: BD.NetcupOptions; nsone: BD.NsoneOptions; one: BD.OnecomOptions
  pantheon: BD.PantheonOptions; pdns: BD.PowerdnsOptions
  qiniu: BD.QiniuOptions; rage4: BD.Rage4Options
  selfhost: BD.SelfhostOptions; servercow: BD.ServercowOptions
  sedo: BD.SedoOptions; allinkl: BD.AllinklOptions
  conoha: BD.ConohaOptions; centarra: BD.CentarraOptions
  kapper: BD.KapperOptions; nederhost: BD.NederhostOptions
  ispconfig: BD.IspconfigOptions
  '1984': BD2.Nineteen84bOptions; acmeproxy: BD2.AcmeproxyOptions
  ait: BD2.AitOptions; bytemill: BD2.BytemillOptions
  centarra2: BD2.Centarra2Options; cloudns2: BD2.Cloudns2Options
  df: BD2.DfeuOptions; dnsservices: BD2.DnsservicesOptions
  doho: BD2.DohoOptions; furnas: BD2.FurnasOptions
  hostingbe: BD2.HostingbeOptions; ilkera: BD2.IlkeraOptions
  infoblox: BD2.InfobloxOptions; jiyou: BD2.JiyouOptions
  kappernet: BD2.KappernetOptions; kx: BD2.KxOptions
  magicdns: BD2.MagicdnsOptions; mailru: BD2.MailruOptions
  mandant: BD2.MandantOptions; mit: BD2.MitOptions
  moe: BD2.MoeOptions; mozilla: BD2.MozillaOptions
  mydevil: BD2.MydevilOptions; mydnsjp: BD2.MydnsjpOptions
  nw: BD2.NwOptions; online: BD2.OnlineOptions
  opends: BD2.OpendsOptions; parkingcrew: BD2.ParkingcrewOptions
  pdd: BD2.PddOptions; pear: BD2.PearOptions; py: BD2.PyOptions
  ru: BD2.RuOptions; schlund: BD2.SchlundOptions; sit: BD2.SitOptions
  uno: BD2.UnoOptions; us: BD2.UsOptions
  variomedia: BD2.VariomediaOptions; vscale: BD2.VscaleOptions
  world4you: BD2.World4youOptions; yandex: BD2.YandexOptions; zeru: BD2.ZeruOptions
}

type ProviderIdList = keyof ProviderOptionsMap

export function getProvider<K extends ProviderIdList>(id: K, options: ProviderOptionsMap[K]): DnsProvider {
  const o = options as unknown as Opts
  switch (id) {
    case 'cf': return new CloudflareProvider(o as CloudflareOptions)
    case 'dp': return new DnspodProvider(o as DnspodOptions)
    case 'ali': return new AliyunProvider(o as AliyunOptions)
    case 'aws': return new AwsRoute53Provider(o as AwsOptions)
    case 'hetzner': return new HetznerProvider(o as HetznerOptions)
    case 'pleskxml': return new PleskXmlProvider(o as PleskXmlOptions)
    // batch-http
    case 'vultr': return new BHttp.VultrProvider(o as BHttp.VultrOptions)
    case 'dgon': return new BHttp.DgonProvider(o as BHttp.DgonOptions)
    case 'linode_v4': return new BHttp.LinodeV4Provider(o as BHttp.LinodeV4Options)
    case 'gandi_livedns': return new BHttp.GandiLiveDnsProvider(o as BHttp.GandiLiveDnsOptions)
    case 'desec': return new BHttp.DesecProvider(o as BHttp.DesecOptions)
    case 'gcore': return new BHttp.GcoreProvider(o as BHttp.GcoreOptions)
    case 'gd': return new BHttp.GdProvider(o as BHttp.GdOptions)
    case 'ionos': return new BHttp.IonosProvider(o as BHttp.IonosOptions)
    // batch-hmac
    case 'tencent': return new BHmac.TencentProvider(o as BHmac.TencentOptions)
    case 'baidu': return new BHmac.BaiduProvider(o as BHmac.BaiduOptions)
    case 'jd': return new BHmac.JdProvider(o as BHmac.JdOptions)
    case 'edgedns': return new BHmac.EdgednsProvider(o as BHmac.EdgednsOptions)
    case 'constellix': return new BHmac.ConstellixProvider(o as BHmac.ConstellixOptions)
    // batch-http2
    case 'doapi': return new BHttp2.DoapiProvider(o as BHttp2.DoapiOptions)
    case 'namecheap': return new BHttp2.NamecheapProvider(o as BHttp2.NamecheapOptions)
    case 'namesilo': return new BHttp2.NamesiloProvider(o as BHttp2.NamesiloOptions)
    case 'ovh': return new BHttp2.OvhProvider(o as BHttp2.OvhOptions)
    case 'inwx': return new BHttp2.InwxProvider(o as BHttp2.InwxOptions)
    case 'loopia': return new BHttp2.LoopiaProvider(o as BHttp2.LoopiaOptions)
    // batch-b
    case 'me': return new BB.MeProvider(o as BB.MeOptions)
    case 'active24': return new BB.Active24Provider(o as BB.Active24Options)
    case 'aurora': return new BB.AuroraProvider(o as BB.AuroraOptions)
    case 'exoscale': return new BB.ExoscaleProvider(o as BB.ExoscaleOptions)
    case 'websupport': return new BB.WebsupportProvider(o as BB.WebsupportOptions)
    // batch-c
    case 'porkbun': return new BC.PorkbunProvider(o as BC.PorkbunOptions)
    case 'bunny': return new BC.BunnyProvider(o as BC.BunnyOptions)
    case 'cloudns': return new BC.CloudnsProvider(o as BC.CloudnsOptions)
    case 'dynu': return new BC.DynuProvider(o as BC.DynuOptions)
    case 'acmedns': return new BC.AcmednsProvider(o as BC.AcmednsOptions)
    case 'dreamhost': return new BC.DreamhostProvider(o as BC.DreamhostOptions)
    case 'freedns': return new BC.FreednsProvider(o as BC.FreednsOptions)
    case 'njalla': return new BC.NjallaProvider(o as BC.NjallaOptions)
    case 'netlify': return new BC.NetlifyProvider(o as BC.NetlifyOptions)
    case 'vercel': return new BC.VercelProvider(o as BC.VercelOptions)
    case 'transip': return new BC.TransipProvider(o as BC.TransipOptions)
    case 'scaleway': return new BC.ScalewayProvider(o as BC.ScalewayOptions)
    case 'infomaniak': return new BC.InfomaniakProvider(o as BC.InfomaniakOptions)
    case 'selectel': return new BC.SelectelProvider(o as BC.SelectelOptions)
    case 'spaceship': return new BC.SpaceshipProvider(o as BC.SpaceshipOptions)
    case 'zonomi': return new BC.ZonomiProvider(o as BC.ZonomiOptions)
    case 'rackspace': return new BC.RackspaceProvider(o as BC.RackspaceOptions)
    case 'hetznercloud': return new BC.HetznercloudProvider(o as BC.HetznercloudOptions)
    case 'oci': return new BC.OciProvider(o as BC.OciOptions)
    case 'huaweicloud': return new BC.HuaweicloudProvider(o as BC.HuaweicloudOptions)
    case 'dyn': return new BC.DynProvider(o as BC.DynOptions)
    case 'simply': return new BC.SimplyProvider(o as BC.SimplyOptions)
    case 'timeweb': return new BC.TimewebProvider(o as BC.TimewebOptions)
    case 'leaseweb': return new BC.LeasewebProvider(o as BC.LeasewebOptions)
    case 'hostup': return new BC.HostupProvider(o as BC.HostupOptions)
    case 'internetbs': return new BC.InternetbsProvider(o as BC.InternetbsOptions)
    case 'regru': return new BC.RegruProvider(o as BC.RegruOptions)
    case 'veesp': return new BC.VeespProvider(o as BC.VeespOptions)
    case 'zilore': return new BC.ZiloreProvider(o as BC.ZiloreOptions)
    case 'zone': return new BC.ZoneProvider(o as BC.ZoneOptions)
    // batch-d
    case '1984hosting': return new BD.Nineteen84Provider(o as BD.Nineteen84Options)
    case 'arvan': return new BD.ArvanProvider(o as BD.ArvanOptions)
    case 'autodns': return new BD.AutodnsProvider(o as BD.AutodnsOptions)
    case 'cx': return new BD.CloudxProvider(o as BD.CloudxOptions)
    case 'cpanel': return new BD.CpanelProvider(o as BD.CpanelOptions)
    case 'ddnss': return new BD.DdnssProvider(o as BD.DdnssOptions)
    case 'dnsimple': return new BD.DnsimpleProvider(o as BD.DnsimpleOptions)
    case 'dnsmadeeasy': return new BD.DnsmadeeasyProvider(o as BD.DnsmadeeasyOptions)
    case 'dominion': return new BD.DominionProvider(o as BD.DominionOptions)
    case 'durabledns': return new BD.DurablednsProvider(o as BD.DurablednsOptions)
    case 'dynv6': return new BD.Dynv6Provider(o as BD.Dynv6Options)
    case 'easydns': return new BD.EasydnsProvider(o as BD.EasydnsOptions)
    case 'euserv': return new BD.EuservProvider(o as BD.EuservOptions)
    case 'futurecms': return new BD.FuturecmsProvider(o as BD.FuturecmsOptions)
    case 'gcloud': return new BD.GcloudProvider(o as BD.GcloudOptions)
    case 'he': return new BD.HeProvider(o as BD.HeOptions)
    case 'joker': return new BD.JokerProvider(o as BD.JokerOptions)
    case 'kinghost': return new BD.KinghostProvider(o as BD.KinghostOptions)
    case 'knot': return new BD.KnotProvider(o as BD.KnotOptions)
    case 'luadns': return new BD.LuadnsProvider(o as BD.LuadnsOptions)
    case 'mythic': return new BD.MythicProvider(o as BD.MythicOptions)
    case 'namecom': return new BD.NamecomProvider(o as BD.NamecomOptions)
    case 'natro': return new BD.NatroProvider(o as BD.NatroOptions)
    case 'netcup': return new BD.NetcupProvider(o as BD.NetcupOptions)
    case 'nsone': return new BD.NsoneProvider(o as BD.NsoneOptions)
    case 'one': return new BD.OnecomProvider(o as BD.OnecomOptions)
    case 'pantheon': return new BD.PantheonProvider(o as BD.PantheonOptions)
    case 'pdns': return new BD.PowerdnsProvider(o as BD.PowerdnsOptions)
    case 'qiniu': return new BD.QiniuProvider(o as BD.QiniuOptions)
    case 'rage4': return new BD.Rage4Provider(o as BD.Rage4Options)
    case 'selfhost': return new BD.SelfhostProvider(o as BD.SelfhostOptions)
    case 'servercow': return new BD.ServercowProvider(o as BD.ServercowOptions)
    case 'sedo': return new BD.SedoProvider(o as BD.SedoOptions)
    case 'allinkl': return new BD.AllinklProvider(o as BD.AllinklOptions)
    case 'conoha': return new BD.ConohaProvider(o as BD.ConohaOptions)
    case 'centarra': return new BD.CentarraProvider(o as BD.CentarraOptions)
    case 'kapper': return new BD.KapperProvider(o as BD.KapperOptions)
    case 'nederhost': return new BD.NederhostProvider(o as BD.NederhostOptions)
    case 'ispconfig': return new BD.IspconfigProvider(o as BD.IspconfigOptions)
    // batch-d2
    case '1984': return new BD2.Nineteen84bProvider(o as BD2.Nineteen84bOptions)
    case 'acmeproxy': return new BD2.AcmeproxyProvider(o as BD2.AcmeproxyOptions)
    case 'ait': return new BD2.AitProvider(o as BD2.AitOptions)
    case 'bytemill': return new BD2.BytemillProvider(o as BD2.BytemillOptions)
    case 'centarra2': return new BD2.Centarra2Provider(o as BD2.Centarra2Options)
    case 'cloudns2': return new BD2.Cloudns2Provider(o as BD2.Cloudns2Options)
    case 'df': return new BD2.DfeuProvider(o as BD2.DfeuOptions)
    case 'dnsservices': return new BD2.DnsservicesProvider(o as BD2.DnsservicesOptions)
    case 'doho': return new BD2.DohoProvider(o as BD2.DohoOptions)
    case 'furnas': return new BD2.FurnasProvider(o as BD2.FurnasOptions)
    case 'hostingbe': return new BD2.HostingbeProvider(o as BD2.HostingbeOptions)
    case 'ilkera': return new BD2.IlkeraProvider(o as BD2.IlkeraOptions)
    case 'infoblox': return new BD2.InfobloxProvider(o as BD2.InfobloxOptions)
    case 'jiyou': return new BD2.JiyouProvider(o as BD2.JiyouOptions)
    case 'kappernet': return new BD2.KappernetProvider(o as BD2.KappernetOptions)
    case 'kx': return new BD2.KxProvider(o as BD2.KxOptions)
    case 'magicdns': return new BD2.MagicdnsProvider(o as BD2.MagicdnsOptions)
    case 'mailru': return new BD2.MailruProvider(o as BD2.MailruOptions)
    case 'mandant': return new BD2.MandantProvider(o as BD2.MandantOptions)
    case 'mit': return new BD2.MitProvider(o as BD2.MitOptions)
    case 'moe': return new BD2.MoeProvider(o as BD2.MoeOptions)
    case 'mozilla': return new BD2.MozillaProvider(o as BD2.MozillaOptions)
    case 'mydevil': return new BD2.MydevilProvider(o as BD2.MydevilOptions)
    case 'mydnsjp': return new BD2.MydnsjpProvider(o as BD2.MydnsjpOptions)
    case 'nw': return new BD2.NwProvider(o as BD2.NwOptions)
    case 'online': return new BD2.OnlineProvider(o as BD2.OnlineOptions)
    case 'opends': return new BD2.OpendsProvider(o as BD2.OpendsOptions)
    case 'parkingcrew': return new BD2.ParkingcrewProvider(o as BD2.ParkingcrewOptions)
    case 'pdd': return new BD2.PddProvider(o as BD2.PddOptions)
    case 'pear': return new BD2.PearProvider(o as BD2.PearOptions)
    case 'py': return new BD2.PyProvider(o as BD2.PyOptions)
    case 'ru': return new BD2.RuProvider(o as BD2.RuOptions)
    case 'schlund': return new BD2.SchlundProvider(o as BD2.SchlundOptions)
    case 'sit': return new BD2.SitProvider(o as BD2.SitOptions)
    case 'uno': return new BD2.UnoProvider(o as BD2.UnoOptions)
    case 'us': return new BD2.UsProvider(o as BD2.UsOptions)
    case 'variomedia': return new BD2.VariomediaProvider(o as BD2.VariomediaOptions)
    case 'vscale': return new BD2.VscaleProvider(o as BD2.VscaleOptions)
    case 'world4you': return new BD2.World4youProvider(o as BD2.World4youOptions)
    case 'yandex': return new BD2.YandexProvider(o as BD2.YandexOptions)
    case 'zeru': return new BD2.ZeruProvider(o as BD2.ZeruOptions)
    default: throw new Error(`Unknown provider: ${id as string}`)
  }
}

// ─── Re-exports ──────────────────────────────────────────────────
export type { DnsProvider } from './types.ts'
export type { DnsProviderContext, TxtRecordInput } from './types.ts'
export { HttpProviderBase } from './base-http.ts'
export { HmacProviderBase } from './base-hmac.ts'
export { XmlProviderBase } from './base-xml.ts'
export { CloudflareProvider } from './cf.ts'
export type { CloudflareOptions } from './cf.ts'
export { DnspodProvider } from './dp.ts'
export type { DnspodOptions } from './dp.ts'
export { AliyunProvider } from './ali.ts'
export type { AliyunOptions } from './ali.ts'
export { AwsRoute53Provider } from './aws.ts'
export type { AwsOptions } from './aws.ts'
export { HetznerProvider } from './hetzner.ts'
export type { HetznerOptions } from './hetzner.ts'
export { PleskXmlProvider } from './pleskxml.ts'
export type { PleskXmlOptions } from './pleskxml.ts'
export * from './batch-http.ts'
export * from './batch-hmac.ts'
export * from './batch-http2.ts'
export * from './batch-b.ts'
export * from './batch-c.ts'
export * from './batch-d.ts'
export * from './batch-d2.ts'
