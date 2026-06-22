import type { DnsProvider, DnsProviderContext } from './types.ts'

import { Nineteen84bProvider, type Nineteen84bOptions } from './dns_1984.ts'
import { Nineteen84Provider, type Nineteen84Options } from './dns_1984hosting.ts'
import { AcmednsProvider, type AcmednsOptions } from './dns_acmedns.ts'
import { AcmeproxyProvider, type AcmeproxyOptions } from './dns_acmeproxy.ts'
import { Active24Provider, type Active24Options } from './dns_active24.ts'
import { AitProvider, type AitOptions } from './dns_ait.ts'
import { AliyunProvider, type AliyunOptions } from './dns_ali.ts'
import { AllinklProvider, type AllinklOptions } from './dns_allinkl.ts'
import { ArvanProvider, type ArvanOptions } from './dns_arvan.ts'
import { AuroraProvider, type AuroraOptions } from './dns_aurora.ts'
import { AutodnsProvider, type AutodnsOptions } from './dns_autodns.ts'
import { AwsRoute53Provider, type AwsOptions } from './dns_aws.ts'
import { BaiduProvider, type BaiduOptions } from './dns_baidu.ts'
import { BunnyProvider, type BunnyOptions } from './dns_bunny.ts'
import { BytemillProvider, type BytemillOptions } from './dns_bytemill.ts'
import { CentarraProvider, type CentarraOptions } from './dns_centarra.ts'
import { Centarra2Provider, type Centarra2Options } from './dns_centarra2.ts'
import { CloudflareProvider, type CloudflareOptions } from './dns_cf.ts'
import { CloudnsProvider, type CloudnsOptions } from './dns_cloudns.ts'
import { Cloudns2Provider, type Cloudns2Options } from './dns_cloudns2.ts'
import { ConohaProvider, type ConohaOptions } from './dns_conoha.ts'
import { ConstellixProvider, type ConstellixOptions } from './dns_constellix.ts'
import { CpanelProvider, type CpanelOptions } from './dns_cpanel.ts'
import { CloudxProvider, type CloudxOptions } from './dns_cx.ts'
import { DdnssProvider, type DdnssOptions } from './dns_ddnss.ts'
import { DesecProvider, type DesecOptions } from './dns_desec.ts'
import { DfeuProvider, type DfeuOptions } from './dns_df.ts'
import { DgonProvider, type DgonOptions } from './dns_dgon.ts'
import { DnsimpleProvider, type DnsimpleOptions } from './dns_dnsimple.ts'
import { DnsmadeeasyProvider, type DnsmadeeasyOptions } from './dns_dnsmadeeasy.ts'
import { DnsservicesProvider, type DnsservicesOptions } from './dns_dnsservices.ts'
import { DoapiProvider, type DoapiOptions } from './dns_doapi.ts'
import { DohoProvider, type DohoOptions } from './dns_doho.ts'
import { DominionProvider, type DominionOptions } from './dns_dominion.ts'
import { DnspodProvider, type DnspodOptions } from './dns_dp.ts'
import { DreamhostProvider, type DreamhostOptions } from './dns_dreamhost.ts'
import { DurablednsProvider, type DurablednsOptions } from './dns_durabledns.ts'
import { DynProvider, type DynOptions } from './dns_dyn.ts'
import { DynuProvider, type DynuOptions } from './dns_dynu.ts'
import { Dynv6Provider, type Dynv6Options } from './dns_dynv6.ts'
import { EasydnsProvider, type EasydnsOptions } from './dns_easydns.ts'
import { EdgednsProvider, type EdgednsOptions } from './dns_edgedns.ts'
import { EuservProvider, type EuservOptions } from './dns_euserv.ts'
import { ExoscaleProvider, type ExoscaleOptions } from './dns_exoscale.ts'
import { FreednsProvider, type FreednsOptions } from './dns_freedns.ts'
import { FurnasProvider, type FurnasOptions } from './dns_furnas.ts'
import { FuturecmsProvider, type FuturecmsOptions } from './dns_futurecms.ts'
import { GandiLiveDnsProvider, type GandiLiveDnsOptions } from './dns_gandi_livedns.ts'
import { GcloudProvider, type GcloudOptions } from './dns_gcloud.ts'
import { GcoreProvider, type GcoreOptions } from './dns_gcore.ts'
import { GdProvider, type GdOptions } from './dns_gd.ts'
import { HeProvider, type HeOptions } from './dns_he.ts'
import { HetznerProvider, type HetznerOptions } from './dns_hetzner.ts'
import { HetznercloudProvider, type HetznercloudOptions } from './dns_hetznercloud.ts'
import { HostingbeProvider, type HostingbeOptions } from './dns_hostingbe.ts'
import { HostupProvider, type HostupOptions } from './dns_hostup.ts'
import { HuaweicloudProvider, type HuaweicloudOptions } from './dns_huaweicloud.ts'
import { IlkeraProvider, type IlkeraOptions } from './dns_ilkera.ts'
import { InfobloxProvider, type InfobloxOptions } from './dns_infoblox.ts'
import { InfomaniakProvider, type InfomaniakOptions } from './dns_infomaniak.ts'
import { InternetbsProvider, type InternetbsOptions } from './dns_internetbs.ts'
import { InwxProvider, type InwxOptions } from './dns_inwx.ts'
import { IonosProvider, type IonosOptions } from './dns_ionos.ts'
import { IspconfigProvider, type IspconfigOptions } from './dns_ispconfig.ts'
import { JdProvider, type JdOptions } from './dns_jd.ts'
import { JiyouProvider, type JiyouOptions } from './dns_jiyou.ts'
import { JokerProvider, type JokerOptions } from './dns_joker.ts'
import { KapperProvider, type KapperOptions } from './dns_kapper.ts'
import { KappernetProvider, type KappernetOptions } from './dns_kappernet.ts'
import { KinghostProvider, type KinghostOptions } from './dns_kinghost.ts'
import { KnotProvider, type KnotOptions } from './dns_knot.ts'
import { KxProvider, type KxOptions } from './dns_kx.ts'
import { LeasewebProvider, type LeasewebOptions } from './dns_leaseweb.ts'
import { LinodeV4Provider, type LinodeV4Options } from './dns_linode_v4.ts'
import { LoopiaProvider, type LoopiaOptions } from './dns_loopia.ts'
import { LuadnsProvider, type LuadnsOptions } from './dns_luadns.ts'
import { MagicdnsProvider, type MagicdnsOptions } from './dns_magicdns.ts'
import { MailruProvider, type MailruOptions } from './dns_mailru.ts'
import { MandantProvider, type MandantOptions } from './dns_mandant.ts'
import { MeProvider, type MeOptions } from './dns_me.ts'
import { MitProvider, type MitOptions } from './dns_mit.ts'
import { MoeProvider, type MoeOptions } from './dns_moe.ts'
import { MozillaProvider, type MozillaOptions } from './dns_mozilla.ts'
import { MydevilProvider, type MydevilOptions } from './dns_mydevil.ts'
import { MydnsjpProvider, type MydnsjpOptions } from './dns_mydnsjp.ts'
import { MythicProvider, type MythicOptions } from './dns_mythic.ts'
import { NamecheapProvider, type NamecheapOptions } from './dns_namecheap.ts'
import { NamecomProvider, type NamecomOptions } from './dns_namecom.ts'
import { NamesiloProvider, type NamesiloOptions } from './dns_namesilo.ts'
import { NatroProvider, type NatroOptions } from './dns_natro.ts'
import { NederhostProvider, type NederhostOptions } from './dns_nederhost.ts'
import { NetcupProvider, type NetcupOptions } from './dns_netcup.ts'
import { NetlifyProvider, type NetlifyOptions } from './dns_netlify.ts'
import { NjallaProvider, type NjallaOptions } from './dns_njalla.ts'
import { NsoneProvider, type NsoneOptions } from './dns_nsone.ts'
import { NwProvider, type NwOptions } from './dns_nw.ts'
import { OciProvider, type OciOptions } from './dns_oci.ts'
import { OnecomProvider, type OnecomOptions } from './dns_one.ts'
import { OnlineProvider, type OnlineOptions } from './dns_online.ts'
import { OpendsProvider, type OpendsOptions } from './dns_opends.ts'
import { OvhProvider, type OvhOptions } from './dns_ovh.ts'
import { PantheonProvider, type PantheonOptions } from './dns_pantheon.ts'
import { ParkingcrewProvider, type ParkingcrewOptions } from './dns_parkingcrew.ts'
import { PddProvider, type PddOptions } from './dns_pdd.ts'
import { PowerdnsProvider, type PowerdnsOptions } from './dns_pdns.ts'
import { PearProvider, type PearOptions } from './dns_pear.ts'
import { PleskXmlProvider, type PleskXmlOptions } from './dns_pleskxml.ts'
import { PorkbunProvider, type PorkbunOptions } from './dns_porkbun.ts'
import { PyProvider, type PyOptions } from './dns_py.ts'
import { QiniuProvider, type QiniuOptions } from './dns_qiniu.ts'
import { RackspaceProvider, type RackspaceOptions } from './dns_rackspace.ts'
import { Rage4Provider, type Rage4Options } from './dns_rage4.ts'
import { RegruProvider, type RegruOptions } from './dns_regru.ts'
import { RuProvider, type RuOptions } from './dns_ru.ts'
import { ScalewayProvider, type ScalewayOptions } from './dns_scaleway.ts'
import { SchlundProvider, type SchlundOptions } from './dns_schlund.ts'
import { SedoProvider, type SedoOptions } from './dns_sedo.ts'
import { SelectelProvider, type SelectelOptions } from './dns_selectel.ts'
import { SelfhostProvider, type SelfhostOptions } from './dns_selfhost.ts'
import { ServercowProvider, type ServercowOptions } from './dns_servercow.ts'
import { SimplyProvider, type SimplyOptions } from './dns_simply.ts'
import { SitProvider, type SitOptions } from './dns_sit.ts'
import { SpaceshipProvider, type SpaceshipOptions } from './dns_spaceship.ts'
import { TencentProvider, type TencentOptions } from './dns_tencent.ts'
import { TimewebProvider, type TimewebOptions } from './dns_timeweb.ts'
import { TransipProvider, type TransipOptions } from './dns_transip.ts'
import { UnoProvider, type UnoOptions } from './dns_uno.ts'
import { UsProvider, type UsOptions } from './dns_us.ts'
import { VariomediaProvider, type VariomediaOptions } from './dns_variomedia.ts'
import { VeespProvider, type VeespOptions } from './dns_veesp.ts'
import { VercelProvider, type VercelOptions } from './dns_vercel.ts'
import { VscaleProvider, type VscaleOptions } from './dns_vscale.ts'
import { VultrProvider, type VultrOptions } from './dns_vultr.ts'
import { WebsupportProvider, type WebsupportOptions } from './dns_websupport.ts'
import { World4youProvider, type World4youOptions } from './dns_world4you.ts'
import { YandexProvider, type YandexOptions } from './dns_yandex.ts'
import { ZeruProvider, type ZeruOptions } from './dns_zeru.ts'
import { ZiloreProvider, type ZiloreOptions } from './dns_zilore.ts'
import { ZoneProvider, type ZoneOptions } from './dns_zone.ts'
import { ZonomiProvider, type ZonomiOptions } from './dns_zonomi.ts'

export type ProviderId =
  | '1984'
  | '1984hosting'
  | 'acmedns'
  | 'acmeproxy'
  | 'active24'
  | 'ait'
  | 'ali'
  | 'allinkl'
  | 'arvan'
  | 'aurora'
  | 'autodns'
  | 'aws'
  | 'baidu'
  | 'bunny'
  | 'bytemill'
  | 'centarra'
  | 'centarra2'
  | 'cf'
  | 'cloudns'
  | 'cloudns2'
  | 'conoha'
  | 'constellix'
  | 'cpanel'
  | 'cx'
  | 'ddnss'
  | 'desec'
  | 'df'
  | 'dgon'
  | 'dnsimple'
  | 'dnsmadeeasy'
  | 'dnsservices'
  | 'doapi'
  | 'doho'
  | 'dominion'
  | 'dp'
  | 'dreamhost'
  | 'durabledns'
  | 'dyn'
  | 'dynu'
  | 'dynv6'
  | 'easydns'
  | 'edgedns'
  | 'euserv'
  | 'exoscale'
  | 'freedns'
  | 'furnas'
  | 'futurecms'
  | 'gandi_livedns'
  | 'gcloud'
  | 'gcore'
  | 'gd'
  | 'he'
  | 'hetzner'
  | 'hetznercloud'
  | 'hostingbe'
  | 'hostup'
  | 'huaweicloud'
  | 'ilkera'
  | 'infoblox'
  | 'infomaniak'
  | 'internetbs'
  | 'inwx'
  | 'ionos'
  | 'ispconfig'
  | 'jd'
  | 'jiyou'
  | 'joker'
  | 'kapper'
  | 'kappernet'
  | 'kinghost'
  | 'knot'
  | 'kx'
  | 'leaseweb'
  | 'linode_v4'
  | 'loopia'
  | 'luadns'
  | 'magicdns'
  | 'mailru'
  | 'mandant'
  | 'me'
  | 'mit'
  | 'moe'
  | 'mozilla'
  | 'mydevil'
  | 'mydnsjp'
  | 'mythic'
  | 'namecheap'
  | 'namecom'
  | 'namesilo'
  | 'natro'
  | 'nederhost'
  | 'netcup'
  | 'netlify'
  | 'njalla'
  | 'nsone'
  | 'nw'
  | 'oci'
  | 'one'
  | 'online'
  | 'opends'
  | 'ovh'
  | 'pantheon'
  | 'parkingcrew'
  | 'pdd'
  | 'pdns'
  | 'pear'
  | 'pleskxml'
  | 'porkbun'
  | 'py'
  | 'qiniu'
  | 'rackspace'
  | 'rage4'
  | 'regru'
  | 'ru'
  | 'scaleway'
  | 'schlund'
  | 'sedo'
  | 'selectel'
  | 'selfhost'
  | 'servercow'
  | 'simply'
  | 'sit'
  | 'spaceship'
  | 'tencent'
  | 'timeweb'
  | 'transip'
  | 'uno'
  | 'us'
  | 'variomedia'
  | 'veesp'
  | 'vercel'
  | 'vscale'
  | 'vultr'
  | 'websupport'
  | 'world4you'
  | 'yandex'
  | 'zeru'
  | 'zilore'
  | 'zone'
  | 'zonomi'

type Opts = unknown

interface ProviderOptionsMap {
  '1984': Nineteen84bOptions
  '1984hosting': Nineteen84Options
  'acmedns': AcmednsOptions
  'acmeproxy': AcmeproxyOptions
  'active24': Active24Options
  'ait': AitOptions
  'ali': AliyunOptions
  'allinkl': AllinklOptions
  'arvan': ArvanOptions
  'aurora': AuroraOptions
  'autodns': AutodnsOptions
  'aws': AwsOptions
  'baidu': BaiduOptions
  'bunny': BunnyOptions
  'bytemill': BytemillOptions
  'centarra': CentarraOptions
  'centarra2': Centarra2Options
  'cf': CloudflareOptions
  'cloudns': CloudnsOptions
  'cloudns2': Cloudns2Options
  'conoha': ConohaOptions
  'constellix': ConstellixOptions
  'cpanel': CpanelOptions
  'cx': CloudxOptions
  'ddnss': DdnssOptions
  'desec': DesecOptions
  'df': DfeuOptions
  'dgon': DgonOptions
  'dnsimple': DnsimpleOptions
  'dnsmadeeasy': DnsmadeeasyOptions
  'dnsservices': DnsservicesOptions
  'doapi': DoapiOptions
  'doho': DohoOptions
  'dominion': DominionOptions
  'dp': DnspodOptions
  'dreamhost': DreamhostOptions
  'durabledns': DurablednsOptions
  'dyn': DynOptions
  'dynu': DynuOptions
  'dynv6': Dynv6Options
  'easydns': EasydnsOptions
  'edgedns': EdgednsOptions
  'euserv': EuservOptions
  'exoscale': ExoscaleOptions
  'freedns': FreednsOptions
  'furnas': FurnasOptions
  'futurecms': FuturecmsOptions
  'gandi_livedns': GandiLiveDnsOptions
  'gcloud': GcloudOptions
  'gcore': GcoreOptions
  'gd': GdOptions
  'he': HeOptions
  'hetzner': HetznerOptions
  'hetznercloud': HetznercloudOptions
  'hostingbe': HostingbeOptions
  'hostup': HostupOptions
  'huaweicloud': HuaweicloudOptions
  'ilkera': IlkeraOptions
  'infoblox': InfobloxOptions
  'infomaniak': InfomaniakOptions
  'internetbs': InternetbsOptions
  'inwx': InwxOptions
  'ionos': IonosOptions
  'ispconfig': IspconfigOptions
  'jd': JdOptions
  'jiyou': JiyouOptions
  'joker': JokerOptions
  'kapper': KapperOptions
  'kappernet': KappernetOptions
  'kinghost': KinghostOptions
  'knot': KnotOptions
  'kx': KxOptions
  'leaseweb': LeasewebOptions
  'linode_v4': LinodeV4Options
  'loopia': LoopiaOptions
  'luadns': LuadnsOptions
  'magicdns': MagicdnsOptions
  'mailru': MailruOptions
  'mandant': MandantOptions
  'me': MeOptions
  'mit': MitOptions
  'moe': MoeOptions
  'mozilla': MozillaOptions
  'mydevil': MydevilOptions
  'mydnsjp': MydnsjpOptions
  'mythic': MythicOptions
  'namecheap': NamecheapOptions
  'namecom': NamecomOptions
  'namesilo': NamesiloOptions
  'natro': NatroOptions
  'nederhost': NederhostOptions
  'netcup': NetcupOptions
  'netlify': NetlifyOptions
  'njalla': NjallaOptions
  'nsone': NsoneOptions
  'nw': NwOptions
  'oci': OciOptions
  'one': OnecomOptions
  'online': OnlineOptions
  'opends': OpendsOptions
  'ovh': OvhOptions
  'pantheon': PantheonOptions
  'parkingcrew': ParkingcrewOptions
  'pdd': PddOptions
  'pdns': PowerdnsOptions
  'pear': PearOptions
  'pleskxml': PleskXmlOptions
  'porkbun': PorkbunOptions
  'py': PyOptions
  'qiniu': QiniuOptions
  'rackspace': RackspaceOptions
  'rage4': Rage4Options
  'regru': RegruOptions
  'ru': RuOptions
  'scaleway': ScalewayOptions
  'schlund': SchlundOptions
  'sedo': SedoOptions
  'selectel': SelectelOptions
  'selfhost': SelfhostOptions
  'servercow': ServercowOptions
  'simply': SimplyOptions
  'sit': SitOptions
  'spaceship': SpaceshipOptions
  'tencent': TencentOptions
  'timeweb': TimewebOptions
  'transip': TransipOptions
  'uno': UnoOptions
  'us': UsOptions
  'variomedia': VariomediaOptions
  'veesp': VeespOptions
  'vercel': VercelOptions
  'vscale': VscaleOptions
  'vultr': VultrOptions
  'websupport': WebsupportOptions
  'world4you': World4youOptions
  'yandex': YandexOptions
  'zeru': ZeruOptions
  'zilore': ZiloreOptions
  'zone': ZoneOptions
  'zonomi': ZonomiOptions
}

type ProviderIdList = keyof ProviderOptionsMap

export function getProvider<K extends ProviderIdList>(id: K, options: ProviderOptionsMap[K], ctx?: DnsProviderContext): DnsProvider {
  const p = _createProvider(id, options)
  if (ctx) p.setContext(ctx)
  return p
}

function _createProvider<K extends ProviderIdList>(id: K, options: ProviderOptionsMap[K]): DnsProvider {
  const o = options as unknown as Opts
  switch (id) {
    case '1984': return new Nineteen84bProvider(o as Nineteen84bOptions)
    case '1984hosting': return new Nineteen84Provider(o as Nineteen84Options)
    case 'acmedns': return new AcmednsProvider(o as AcmednsOptions)
    case 'acmeproxy': return new AcmeproxyProvider(o as AcmeproxyOptions)
    case 'active24': return new Active24Provider(o as Active24Options)
    case 'ait': return new AitProvider(o as AitOptions)
    case 'ali': return new AliyunProvider(o as AliyunOptions)
    case 'allinkl': return new AllinklProvider(o as AllinklOptions)
    case 'arvan': return new ArvanProvider(o as ArvanOptions)
    case 'aurora': return new AuroraProvider(o as AuroraOptions)
    case 'autodns': return new AutodnsProvider(o as AutodnsOptions)
    case 'aws': return new AwsRoute53Provider(o as AwsOptions)
    case 'baidu': return new BaiduProvider(o as BaiduOptions)
    case 'bunny': return new BunnyProvider(o as BunnyOptions)
    case 'bytemill': return new BytemillProvider(o as BytemillOptions)
    case 'centarra': return new CentarraProvider(o as CentarraOptions)
    case 'centarra2': return new Centarra2Provider(o as Centarra2Options)
    case 'cf': return new CloudflareProvider(o as CloudflareOptions)
    case 'cloudns': return new CloudnsProvider(o as CloudnsOptions)
    case 'cloudns2': return new Cloudns2Provider(o as Cloudns2Options)
    case 'conoha': return new ConohaProvider(o as ConohaOptions)
    case 'constellix': return new ConstellixProvider(o as ConstellixOptions)
    case 'cpanel': return new CpanelProvider(o as CpanelOptions)
    case 'cx': return new CloudxProvider(o as CloudxOptions)
    case 'ddnss': return new DdnssProvider(o as DdnssOptions)
    case 'desec': return new DesecProvider(o as DesecOptions)
    case 'df': return new DfeuProvider(o as DfeuOptions)
    case 'dgon': return new DgonProvider(o as DgonOptions)
    case 'dnsimple': return new DnsimpleProvider(o as DnsimpleOptions)
    case 'dnsmadeeasy': return new DnsmadeeasyProvider(o as DnsmadeeasyOptions)
    case 'dnsservices': return new DnsservicesProvider(o as DnsservicesOptions)
    case 'doapi': return new DoapiProvider(o as DoapiOptions)
    case 'doho': return new DohoProvider(o as DohoOptions)
    case 'dominion': return new DominionProvider(o as DominionOptions)
    case 'dp': return new DnspodProvider(o as DnspodOptions)
    case 'dreamhost': return new DreamhostProvider(o as DreamhostOptions)
    case 'durabledns': return new DurablednsProvider(o as DurablednsOptions)
    case 'dyn': return new DynProvider(o as DynOptions)
    case 'dynu': return new DynuProvider(o as DynuOptions)
    case 'dynv6': return new Dynv6Provider(o as Dynv6Options)
    case 'easydns': return new EasydnsProvider(o as EasydnsOptions)
    case 'edgedns': return new EdgednsProvider(o as EdgednsOptions)
    case 'euserv': return new EuservProvider(o as EuservOptions)
    case 'exoscale': return new ExoscaleProvider(o as ExoscaleOptions)
    case 'freedns': return new FreednsProvider(o as FreednsOptions)
    case 'furnas': return new FurnasProvider(o as FurnasOptions)
    case 'futurecms': return new FuturecmsProvider(o as FuturecmsOptions)
    case 'gandi_livedns': return new GandiLiveDnsProvider(o as GandiLiveDnsOptions)
    case 'gcloud': return new GcloudProvider(o as GcloudOptions)
    case 'gcore': return new GcoreProvider(o as GcoreOptions)
    case 'gd': return new GdProvider(o as GdOptions)
    case 'he': return new HeProvider(o as HeOptions)
    case 'hetzner': return new HetznerProvider(o as HetznerOptions)
    case 'hetznercloud': return new HetznercloudProvider(o as HetznercloudOptions)
    case 'hostingbe': return new HostingbeProvider(o as HostingbeOptions)
    case 'hostup': return new HostupProvider(o as HostupOptions)
    case 'huaweicloud': return new HuaweicloudProvider(o as HuaweicloudOptions)
    case 'ilkera': return new IlkeraProvider(o as IlkeraOptions)
    case 'infoblox': return new InfobloxProvider(o as InfobloxOptions)
    case 'infomaniak': return new InfomaniakProvider(o as InfomaniakOptions)
    case 'internetbs': return new InternetbsProvider(o as InternetbsOptions)
    case 'inwx': return new InwxProvider(o as InwxOptions)
    case 'ionos': return new IonosProvider(o as IonosOptions)
    case 'ispconfig': return new IspconfigProvider(o as IspconfigOptions)
    case 'jd': return new JdProvider(o as JdOptions)
    case 'jiyou': return new JiyouProvider(o as JiyouOptions)
    case 'joker': return new JokerProvider(o as JokerOptions)
    case 'kapper': return new KapperProvider(o as KapperOptions)
    case 'kappernet': return new KappernetProvider(o as KappernetOptions)
    case 'kinghost': return new KinghostProvider(o as KinghostOptions)
    case 'knot': return new KnotProvider(o as KnotOptions)
    case 'kx': return new KxProvider(o as KxOptions)
    case 'leaseweb': return new LeasewebProvider(o as LeasewebOptions)
    case 'linode_v4': return new LinodeV4Provider(o as LinodeV4Options)
    case 'loopia': return new LoopiaProvider(o as LoopiaOptions)
    case 'luadns': return new LuadnsProvider(o as LuadnsOptions)
    case 'magicdns': return new MagicdnsProvider(o as MagicdnsOptions)
    case 'mailru': return new MailruProvider(o as MailruOptions)
    case 'mandant': return new MandantProvider(o as MandantOptions)
    case 'me': return new MeProvider(o as MeOptions)
    case 'mit': return new MitProvider(o as MitOptions)
    case 'moe': return new MoeProvider(o as MoeOptions)
    case 'mozilla': return new MozillaProvider(o as MozillaOptions)
    case 'mydevil': return new MydevilProvider(o as MydevilOptions)
    case 'mydnsjp': return new MydnsjpProvider(o as MydnsjpOptions)
    case 'mythic': return new MythicProvider(o as MythicOptions)
    case 'namecheap': return new NamecheapProvider(o as NamecheapOptions)
    case 'namecom': return new NamecomProvider(o as NamecomOptions)
    case 'namesilo': return new NamesiloProvider(o as NamesiloOptions)
    case 'natro': return new NatroProvider(o as NatroOptions)
    case 'nederhost': return new NederhostProvider(o as NederhostOptions)
    case 'netcup': return new NetcupProvider(o as NetcupOptions)
    case 'netlify': return new NetlifyProvider(o as NetlifyOptions)
    case 'njalla': return new NjallaProvider(o as NjallaOptions)
    case 'nsone': return new NsoneProvider(o as NsoneOptions)
    case 'nw': return new NwProvider(o as NwOptions)
    case 'oci': return new OciProvider(o as OciOptions)
    case 'one': return new OnecomProvider(o as OnecomOptions)
    case 'online': return new OnlineProvider(o as OnlineOptions)
    case 'opends': return new OpendsProvider(o as OpendsOptions)
    case 'ovh': return new OvhProvider(o as OvhOptions)
    case 'pantheon': return new PantheonProvider(o as PantheonOptions)
    case 'parkingcrew': return new ParkingcrewProvider(o as ParkingcrewOptions)
    case 'pdd': return new PddProvider(o as PddOptions)
    case 'pdns': return new PowerdnsProvider(o as PowerdnsOptions)
    case 'pear': return new PearProvider(o as PearOptions)
    case 'pleskxml': return new PleskXmlProvider(o as PleskXmlOptions)
    case 'porkbun': return new PorkbunProvider(o as PorkbunOptions)
    case 'py': return new PyProvider(o as PyOptions)
    case 'qiniu': return new QiniuProvider(o as QiniuOptions)
    case 'rackspace': return new RackspaceProvider(o as RackspaceOptions)
    case 'rage4': return new Rage4Provider(o as Rage4Options)
    case 'regru': return new RegruProvider(o as RegruOptions)
    case 'ru': return new RuProvider(o as RuOptions)
    case 'scaleway': return new ScalewayProvider(o as ScalewayOptions)
    case 'schlund': return new SchlundProvider(o as SchlundOptions)
    case 'sedo': return new SedoProvider(o as SedoOptions)
    case 'selectel': return new SelectelProvider(o as SelectelOptions)
    case 'selfhost': return new SelfhostProvider(o as SelfhostOptions)
    case 'servercow': return new ServercowProvider(o as ServercowOptions)
    case 'simply': return new SimplyProvider(o as SimplyOptions)
    case 'sit': return new SitProvider(o as SitOptions)
    case 'spaceship': return new SpaceshipProvider(o as SpaceshipOptions)
    case 'tencent': return new TencentProvider(o as TencentOptions)
    case 'timeweb': return new TimewebProvider(o as TimewebOptions)
    case 'transip': return new TransipProvider(o as TransipOptions)
    case 'uno': return new UnoProvider(o as UnoOptions)
    case 'us': return new UsProvider(o as UsOptions)
    case 'variomedia': return new VariomediaProvider(o as VariomediaOptions)
    case 'veesp': return new VeespProvider(o as VeespOptions)
    case 'vercel': return new VercelProvider(o as VercelOptions)
    case 'vscale': return new VscaleProvider(o as VscaleOptions)
    case 'vultr': return new VultrProvider(o as VultrOptions)
    case 'websupport': return new WebsupportProvider(o as WebsupportOptions)
    case 'world4you': return new World4youProvider(o as World4youOptions)
    case 'yandex': return new YandexProvider(o as YandexOptions)
    case 'zeru': return new ZeruProvider(o as ZeruOptions)
    case 'zilore': return new ZiloreProvider(o as ZiloreOptions)
    case 'zone': return new ZoneProvider(o as ZoneOptions)
    case 'zonomi': return new ZonomiProvider(o as ZonomiOptions)
    default: throw new Error(`Unknown provider: ${id as string}`)
  }
}

// ─── Re-exports ──────────────────────────────────────────────────
export type { DnsProvider } from './types.ts'
export type { DnsProviderContext, TxtRecordInput } from './types.ts'
export { HttpProviderBase } from './base-http.ts'
export { HmacProviderBase } from './base-hmac.ts'
export { XmlProviderBase } from './base-xml.ts'
export { Nineteen84bProvider } from './dns_1984.ts'
export type { Nineteen84bOptions } from './dns_1984.ts'
export { Nineteen84Provider } from './dns_1984hosting.ts'
export type { Nineteen84Options } from './dns_1984hosting.ts'
export { AcmednsProvider } from './dns_acmedns.ts'
export type { AcmednsOptions } from './dns_acmedns.ts'
export { AcmeproxyProvider } from './dns_acmeproxy.ts'
export type { AcmeproxyOptions } from './dns_acmeproxy.ts'
export { Active24Provider } from './dns_active24.ts'
export type { Active24Options } from './dns_active24.ts'
export { AitProvider } from './dns_ait.ts'
export type { AitOptions } from './dns_ait.ts'
export { AliyunProvider } from './dns_ali.ts'
export type { AliyunOptions } from './dns_ali.ts'
export { AllinklProvider } from './dns_allinkl.ts'
export type { AllinklOptions } from './dns_allinkl.ts'
export { ArvanProvider } from './dns_arvan.ts'
export type { ArvanOptions } from './dns_arvan.ts'
export { AuroraProvider } from './dns_aurora.ts'
export type { AuroraOptions } from './dns_aurora.ts'
export { AutodnsProvider } from './dns_autodns.ts'
export type { AutodnsOptions } from './dns_autodns.ts'
export { AwsRoute53Provider } from './dns_aws.ts'
export type { AwsOptions } from './dns_aws.ts'
export { BaiduProvider } from './dns_baidu.ts'
export type { BaiduOptions } from './dns_baidu.ts'
export { BunnyProvider } from './dns_bunny.ts'
export type { BunnyOptions } from './dns_bunny.ts'
export { BytemillProvider } from './dns_bytemill.ts'
export type { BytemillOptions } from './dns_bytemill.ts'
export { CentarraProvider } from './dns_centarra.ts'
export type { CentarraOptions } from './dns_centarra.ts'
export { Centarra2Provider } from './dns_centarra2.ts'
export type { Centarra2Options } from './dns_centarra2.ts'
export { CloudflareProvider } from './dns_cf.ts'
export type { CloudflareOptions } from './dns_cf.ts'
export { CloudnsProvider } from './dns_cloudns.ts'
export type { CloudnsOptions } from './dns_cloudns.ts'
export { Cloudns2Provider } from './dns_cloudns2.ts'
export type { Cloudns2Options } from './dns_cloudns2.ts'
export { ConohaProvider } from './dns_conoha.ts'
export type { ConohaOptions } from './dns_conoha.ts'
export { ConstellixProvider } from './dns_constellix.ts'
export type { ConstellixOptions } from './dns_constellix.ts'
export { CpanelProvider } from './dns_cpanel.ts'
export type { CpanelOptions } from './dns_cpanel.ts'
export { CloudxProvider } from './dns_cx.ts'
export type { CloudxOptions } from './dns_cx.ts'
export { DdnssProvider } from './dns_ddnss.ts'
export type { DdnssOptions } from './dns_ddnss.ts'
export { DesecProvider } from './dns_desec.ts'
export type { DesecOptions } from './dns_desec.ts'
export { DfeuProvider } from './dns_df.ts'
export type { DfeuOptions } from './dns_df.ts'
export { DgonProvider } from './dns_dgon.ts'
export type { DgonOptions } from './dns_dgon.ts'
export { DnsimpleProvider } from './dns_dnsimple.ts'
export type { DnsimpleOptions } from './dns_dnsimple.ts'
export { DnsmadeeasyProvider } from './dns_dnsmadeeasy.ts'
export type { DnsmadeeasyOptions } from './dns_dnsmadeeasy.ts'
export { DnsservicesProvider } from './dns_dnsservices.ts'
export type { DnsservicesOptions } from './dns_dnsservices.ts'
export { DoapiProvider } from './dns_doapi.ts'
export type { DoapiOptions } from './dns_doapi.ts'
export { DohoProvider } from './dns_doho.ts'
export type { DohoOptions } from './dns_doho.ts'
export { DominionProvider } from './dns_dominion.ts'
export type { DominionOptions } from './dns_dominion.ts'
export { DnspodProvider } from './dns_dp.ts'
export type { DnspodOptions } from './dns_dp.ts'
export { DreamhostProvider } from './dns_dreamhost.ts'
export type { DreamhostOptions } from './dns_dreamhost.ts'
export { DurablednsProvider } from './dns_durabledns.ts'
export type { DurablednsOptions } from './dns_durabledns.ts'
export { DynProvider } from './dns_dyn.ts'
export type { DynOptions } from './dns_dyn.ts'
export { DynuProvider } from './dns_dynu.ts'
export type { DynuOptions } from './dns_dynu.ts'
export { Dynv6Provider } from './dns_dynv6.ts'
export type { Dynv6Options } from './dns_dynv6.ts'
export { EasydnsProvider } from './dns_easydns.ts'
export type { EasydnsOptions } from './dns_easydns.ts'
export { EdgednsProvider } from './dns_edgedns.ts'
export type { EdgednsOptions } from './dns_edgedns.ts'
export { EuservProvider } from './dns_euserv.ts'
export type { EuservOptions } from './dns_euserv.ts'
export { ExoscaleProvider } from './dns_exoscale.ts'
export type { ExoscaleOptions } from './dns_exoscale.ts'
export { FreednsProvider } from './dns_freedns.ts'
export type { FreednsOptions } from './dns_freedns.ts'
export { FurnasProvider } from './dns_furnas.ts'
export type { FurnasOptions } from './dns_furnas.ts'
export { FuturecmsProvider } from './dns_futurecms.ts'
export type { FuturecmsOptions } from './dns_futurecms.ts'
export { GandiLiveDnsProvider } from './dns_gandi_livedns.ts'
export type { GandiLiveDnsOptions } from './dns_gandi_livedns.ts'
export { GcloudProvider } from './dns_gcloud.ts'
export type { GcloudOptions } from './dns_gcloud.ts'
export { GcoreProvider } from './dns_gcore.ts'
export type { GcoreOptions } from './dns_gcore.ts'
export { GdProvider } from './dns_gd.ts'
export type { GdOptions } from './dns_gd.ts'
export { HeProvider } from './dns_he.ts'
export type { HeOptions } from './dns_he.ts'
export { HetznerProvider } from './dns_hetzner.ts'
export type { HetznerOptions } from './dns_hetzner.ts'
export { HetznercloudProvider } from './dns_hetznercloud.ts'
export type { HetznercloudOptions } from './dns_hetznercloud.ts'
export { HostingbeProvider } from './dns_hostingbe.ts'
export type { HostingbeOptions } from './dns_hostingbe.ts'
export { HostupProvider } from './dns_hostup.ts'
export type { HostupOptions } from './dns_hostup.ts'
export { HuaweicloudProvider } from './dns_huaweicloud.ts'
export type { HuaweicloudOptions } from './dns_huaweicloud.ts'
export { IlkeraProvider } from './dns_ilkera.ts'
export type { IlkeraOptions } from './dns_ilkera.ts'
export { InfobloxProvider } from './dns_infoblox.ts'
export type { InfobloxOptions } from './dns_infoblox.ts'
export { InfomaniakProvider } from './dns_infomaniak.ts'
export type { InfomaniakOptions } from './dns_infomaniak.ts'
export { InternetbsProvider } from './dns_internetbs.ts'
export type { InternetbsOptions } from './dns_internetbs.ts'
export { InwxProvider } from './dns_inwx.ts'
export type { InwxOptions } from './dns_inwx.ts'
export { IonosProvider } from './dns_ionos.ts'
export type { IonosOptions } from './dns_ionos.ts'
export { IspconfigProvider } from './dns_ispconfig.ts'
export type { IspconfigOptions } from './dns_ispconfig.ts'
export { JdProvider } from './dns_jd.ts'
export type { JdOptions } from './dns_jd.ts'
export { JiyouProvider } from './dns_jiyou.ts'
export type { JiyouOptions } from './dns_jiyou.ts'
export { JokerProvider } from './dns_joker.ts'
export type { JokerOptions } from './dns_joker.ts'
export { KapperProvider } from './dns_kapper.ts'
export type { KapperOptions } from './dns_kapper.ts'
export { KappernetProvider } from './dns_kappernet.ts'
export type { KappernetOptions } from './dns_kappernet.ts'
export { KinghostProvider } from './dns_kinghost.ts'
export type { KinghostOptions } from './dns_kinghost.ts'
export { KnotProvider } from './dns_knot.ts'
export type { KnotOptions } from './dns_knot.ts'
export { KxProvider } from './dns_kx.ts'
export type { KxOptions } from './dns_kx.ts'
export { LeasewebProvider } from './dns_leaseweb.ts'
export type { LeasewebOptions } from './dns_leaseweb.ts'
export { LinodeV4Provider } from './dns_linode_v4.ts'
export type { LinodeV4Options } from './dns_linode_v4.ts'
export { LoopiaProvider } from './dns_loopia.ts'
export type { LoopiaOptions } from './dns_loopia.ts'
export { LuadnsProvider } from './dns_luadns.ts'
export type { LuadnsOptions } from './dns_luadns.ts'
export { MagicdnsProvider } from './dns_magicdns.ts'
export type { MagicdnsOptions } from './dns_magicdns.ts'
export { MailruProvider } from './dns_mailru.ts'
export type { MailruOptions } from './dns_mailru.ts'
export { MandantProvider } from './dns_mandant.ts'
export type { MandantOptions } from './dns_mandant.ts'
export { MeProvider } from './dns_me.ts'
export type { MeOptions } from './dns_me.ts'
export { MitProvider } from './dns_mit.ts'
export type { MitOptions } from './dns_mit.ts'
export { MoeProvider } from './dns_moe.ts'
export type { MoeOptions } from './dns_moe.ts'
export { MozillaProvider } from './dns_mozilla.ts'
export type { MozillaOptions } from './dns_mozilla.ts'
export { MydevilProvider } from './dns_mydevil.ts'
export type { MydevilOptions } from './dns_mydevil.ts'
export { MydnsjpProvider } from './dns_mydnsjp.ts'
export type { MydnsjpOptions } from './dns_mydnsjp.ts'
export { MythicProvider } from './dns_mythic.ts'
export type { MythicOptions } from './dns_mythic.ts'
export { NamecheapProvider } from './dns_namecheap.ts'
export type { NamecheapOptions } from './dns_namecheap.ts'
export { NamecomProvider } from './dns_namecom.ts'
export type { NamecomOptions } from './dns_namecom.ts'
export { NamesiloProvider } from './dns_namesilo.ts'
export type { NamesiloOptions } from './dns_namesilo.ts'
export { NatroProvider } from './dns_natro.ts'
export type { NatroOptions } from './dns_natro.ts'
export { NederhostProvider } from './dns_nederhost.ts'
export type { NederhostOptions } from './dns_nederhost.ts'
export { NetcupProvider } from './dns_netcup.ts'
export type { NetcupOptions } from './dns_netcup.ts'
export { NetlifyProvider } from './dns_netlify.ts'
export type { NetlifyOptions } from './dns_netlify.ts'
export { NjallaProvider } from './dns_njalla.ts'
export type { NjallaOptions } from './dns_njalla.ts'
export { NsoneProvider } from './dns_nsone.ts'
export type { NsoneOptions } from './dns_nsone.ts'
export { NwProvider } from './dns_nw.ts'
export type { NwOptions } from './dns_nw.ts'
export { OciProvider } from './dns_oci.ts'
export type { OciOptions } from './dns_oci.ts'
export { OnecomProvider } from './dns_one.ts'
export type { OnecomOptions } from './dns_one.ts'
export { OnlineProvider } from './dns_online.ts'
export type { OnlineOptions } from './dns_online.ts'
export { OpendsProvider } from './dns_opends.ts'
export type { OpendsOptions } from './dns_opends.ts'
export { OvhProvider } from './dns_ovh.ts'
export type { OvhOptions } from './dns_ovh.ts'
export { PantheonProvider } from './dns_pantheon.ts'
export type { PantheonOptions } from './dns_pantheon.ts'
export { ParkingcrewProvider } from './dns_parkingcrew.ts'
export type { ParkingcrewOptions } from './dns_parkingcrew.ts'
export { PddProvider } from './dns_pdd.ts'
export type { PddOptions } from './dns_pdd.ts'
export { PowerdnsProvider } from './dns_pdns.ts'
export type { PowerdnsOptions } from './dns_pdns.ts'
export { PearProvider } from './dns_pear.ts'
export type { PearOptions } from './dns_pear.ts'
export { PleskXmlProvider } from './dns_pleskxml.ts'
export type { PleskXmlOptions } from './dns_pleskxml.ts'
export { PorkbunProvider } from './dns_porkbun.ts'
export type { PorkbunOptions } from './dns_porkbun.ts'
export { PyProvider } from './dns_py.ts'
export type { PyOptions } from './dns_py.ts'
export { QiniuProvider } from './dns_qiniu.ts'
export type { QiniuOptions } from './dns_qiniu.ts'
export { RackspaceProvider } from './dns_rackspace.ts'
export type { RackspaceOptions } from './dns_rackspace.ts'
export { Rage4Provider } from './dns_rage4.ts'
export type { Rage4Options } from './dns_rage4.ts'
export { RegruProvider } from './dns_regru.ts'
export type { RegruOptions } from './dns_regru.ts'
export { RuProvider } from './dns_ru.ts'
export type { RuOptions } from './dns_ru.ts'
export { ScalewayProvider } from './dns_scaleway.ts'
export type { ScalewayOptions } from './dns_scaleway.ts'
export { SchlundProvider } from './dns_schlund.ts'
export type { SchlundOptions } from './dns_schlund.ts'
export { SedoProvider } from './dns_sedo.ts'
export type { SedoOptions } from './dns_sedo.ts'
export { SelectelProvider } from './dns_selectel.ts'
export type { SelectelOptions } from './dns_selectel.ts'
export { SelfhostProvider } from './dns_selfhost.ts'
export type { SelfhostOptions } from './dns_selfhost.ts'
export { ServercowProvider } from './dns_servercow.ts'
export type { ServercowOptions } from './dns_servercow.ts'
export { SimplyProvider } from './dns_simply.ts'
export type { SimplyOptions } from './dns_simply.ts'
export { SitProvider } from './dns_sit.ts'
export type { SitOptions } from './dns_sit.ts'
export { SpaceshipProvider } from './dns_spaceship.ts'
export type { SpaceshipOptions } from './dns_spaceship.ts'
export { TencentProvider } from './dns_tencent.ts'
export type { TencentOptions } from './dns_tencent.ts'
export { TimewebProvider } from './dns_timeweb.ts'
export type { TimewebOptions } from './dns_timeweb.ts'
export { TransipProvider } from './dns_transip.ts'
export type { TransipOptions } from './dns_transip.ts'
export { UnoProvider } from './dns_uno.ts'
export type { UnoOptions } from './dns_uno.ts'
export { UsProvider } from './dns_us.ts'
export type { UsOptions } from './dns_us.ts'
export { VariomediaProvider } from './dns_variomedia.ts'
export type { VariomediaOptions } from './dns_variomedia.ts'
export { VeespProvider } from './dns_veesp.ts'
export type { VeespOptions } from './dns_veesp.ts'
export { VercelProvider } from './dns_vercel.ts'
export type { VercelOptions } from './dns_vercel.ts'
export { VscaleProvider } from './dns_vscale.ts'
export type { VscaleOptions } from './dns_vscale.ts'
export { VultrProvider } from './dns_vultr.ts'
export type { VultrOptions } from './dns_vultr.ts'
export { WebsupportProvider } from './dns_websupport.ts'
export type { WebsupportOptions } from './dns_websupport.ts'
export { World4youProvider } from './dns_world4you.ts'
export type { World4youOptions } from './dns_world4you.ts'
export { YandexProvider } from './dns_yandex.ts'
export type { YandexOptions } from './dns_yandex.ts'
export { ZeruProvider } from './dns_zeru.ts'
export type { ZeruOptions } from './dns_zeru.ts'
export { ZiloreProvider } from './dns_zilore.ts'
export type { ZiloreOptions } from './dns_zilore.ts'
export { ZoneProvider } from './dns_zone.ts'
export type { ZoneOptions } from './dns_zone.ts'
export { ZonomiProvider } from './dns_zonomi.ts'
export type { ZonomiOptions } from './dns_zonomi.ts'
