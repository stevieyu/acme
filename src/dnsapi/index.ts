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

const PROVIDERS = {
  '1984': (o: Nineteen84bOptions): DnsProvider => new Nineteen84bProvider(o),
  '1984hosting': (o: Nineteen84Options): DnsProvider => new Nineteen84Provider(o),
  'acmedns': (o: AcmednsOptions): DnsProvider => new AcmednsProvider(o),
  'acmeproxy': (o: AcmeproxyOptions): DnsProvider => new AcmeproxyProvider(o),
  'active24': (o: Active24Options): DnsProvider => new Active24Provider(o),
  'ait': (o: AitOptions): DnsProvider => new AitProvider(o),
  'ali': (o: AliyunOptions): DnsProvider => new AliyunProvider(o),
  'allinkl': (o: AllinklOptions): DnsProvider => new AllinklProvider(o),
  'arvan': (o: ArvanOptions): DnsProvider => new ArvanProvider(o),
  'aurora': (o: AuroraOptions): DnsProvider => new AuroraProvider(o),
  'autodns': (o: AutodnsOptions): DnsProvider => new AutodnsProvider(o),
  'aws': (o: AwsOptions): DnsProvider => new AwsRoute53Provider(o),
  'baidu': (o: BaiduOptions): DnsProvider => new BaiduProvider(o),
  'bunny': (o: BunnyOptions): DnsProvider => new BunnyProvider(o),
  'bytemill': (o: BytemillOptions): DnsProvider => new BytemillProvider(o),
  'centarra': (o: CentarraOptions): DnsProvider => new CentarraProvider(o),
  'centarra2': (o: Centarra2Options): DnsProvider => new Centarra2Provider(o),
  'cf': (o: CloudflareOptions): DnsProvider => new CloudflareProvider(o),
  'cloudns': (o: CloudnsOptions): DnsProvider => new CloudnsProvider(o),
  'cloudns2': (o: Cloudns2Options): DnsProvider => new Cloudns2Provider(o),
  'conoha': (o: ConohaOptions): DnsProvider => new ConohaProvider(o),
  'constellix': (o: ConstellixOptions): DnsProvider => new ConstellixProvider(o),
  'cpanel': (o: CpanelOptions): DnsProvider => new CpanelProvider(o),
  'cx': (o: CloudxOptions): DnsProvider => new CloudxProvider(o),
  'ddnss': (o: DdnssOptions): DnsProvider => new DdnssProvider(o),
  'desec': (o: DesecOptions): DnsProvider => new DesecProvider(o),
  'df': (o: DfeuOptions): DnsProvider => new DfeuProvider(o),
  'dgon': (o: DgonOptions): DnsProvider => new DgonProvider(o),
  'dnsimple': (o: DnsimpleOptions): DnsProvider => new DnsimpleProvider(o),
  'dnsmadeeasy': (o: DnsmadeeasyOptions): DnsProvider => new DnsmadeeasyProvider(o),
  'dnsservices': (o: DnsservicesOptions): DnsProvider => new DnsservicesProvider(o),
  'doapi': (o: DoapiOptions): DnsProvider => new DoapiProvider(o),
  'doho': (o: DohoOptions): DnsProvider => new DohoProvider(o),
  'dominion': (o: DominionOptions): DnsProvider => new DominionProvider(o),
  'dp': (o: DnspodOptions): DnsProvider => new DnspodProvider(o),
  'dreamhost': (o: DreamhostOptions): DnsProvider => new DreamhostProvider(o),
  'durabledns': (o: DurablednsOptions): DnsProvider => new DurablednsProvider(o),
  'dyn': (o: DynOptions): DnsProvider => new DynProvider(o),
  'dynu': (o: DynuOptions): DnsProvider => new DynuProvider(o),
  'dynv6': (o: Dynv6Options): DnsProvider => new Dynv6Provider(o),
  'easydns': (o: EasydnsOptions): DnsProvider => new EasydnsProvider(o),
  'edgedns': (o: EdgednsOptions): DnsProvider => new EdgednsProvider(o),
  'euserv': (o: EuservOptions): DnsProvider => new EuservProvider(o),
  'exoscale': (o: ExoscaleOptions): DnsProvider => new ExoscaleProvider(o),
  'freedns': (o: FreednsOptions): DnsProvider => new FreednsProvider(o),
  'furnas': (o: FurnasOptions): DnsProvider => new FurnasProvider(o),
  'futurecms': (o: FuturecmsOptions): DnsProvider => new FuturecmsProvider(o),
  'gandi_livedns': (o: GandiLiveDnsOptions): DnsProvider => new GandiLiveDnsProvider(o),
  'gcloud': (o: GcloudOptions): DnsProvider => new GcloudProvider(o),
  'gcore': (o: GcoreOptions): DnsProvider => new GcoreProvider(o),
  'gd': (o: GdOptions): DnsProvider => new GdProvider(o),
  'he': (o: HeOptions): DnsProvider => new HeProvider(o),
  'hetzner': (o: HetznerOptions): DnsProvider => new HetznerProvider(o),
  'hetznercloud': (o: HetznercloudOptions): DnsProvider => new HetznercloudProvider(o),
  'hostingbe': (o: HostingbeOptions): DnsProvider => new HostingbeProvider(o),
  'hostup': (o: HostupOptions): DnsProvider => new HostupProvider(o),
  'huaweicloud': (o: HuaweicloudOptions): DnsProvider => new HuaweicloudProvider(o),
  'ilkera': (o: IlkeraOptions): DnsProvider => new IlkeraProvider(o),
  'infoblox': (o: InfobloxOptions): DnsProvider => new InfobloxProvider(o),
  'infomaniak': (o: InfomaniakOptions): DnsProvider => new InfomaniakProvider(o),
  'internetbs': (o: InternetbsOptions): DnsProvider => new InternetbsProvider(o),
  'inwx': (o: InwxOptions): DnsProvider => new InwxProvider(o),
  'ionos': (o: IonosOptions): DnsProvider => new IonosProvider(o),
  'ispconfig': (o: IspconfigOptions): DnsProvider => new IspconfigProvider(o),
  'jd': (o: JdOptions): DnsProvider => new JdProvider(o),
  'jiyou': (o: JiyouOptions): DnsProvider => new JiyouProvider(o),
  'joker': (o: JokerOptions): DnsProvider => new JokerProvider(o),
  'kapper': (o: KapperOptions): DnsProvider => new KapperProvider(o),
  'kappernet': (o: KappernetOptions): DnsProvider => new KappernetProvider(o),
  'kinghost': (o: KinghostOptions): DnsProvider => new KinghostProvider(o),
  'knot': (o: KnotOptions): DnsProvider => new KnotProvider(o),
  'kx': (o: KxOptions): DnsProvider => new KxProvider(o),
  'leaseweb': (o: LeasewebOptions): DnsProvider => new LeasewebProvider(o),
  'linode_v4': (o: LinodeV4Options): DnsProvider => new LinodeV4Provider(o),
  'loopia': (o: LoopiaOptions): DnsProvider => new LoopiaProvider(o),
  'luadns': (o: LuadnsOptions): DnsProvider => new LuadnsProvider(o),
  'magicdns': (o: MagicdnsOptions): DnsProvider => new MagicdnsProvider(o),
  'mailru': (o: MailruOptions): DnsProvider => new MailruProvider(o),
  'mandant': (o: MandantOptions): DnsProvider => new MandantProvider(o),
  'me': (o: MeOptions): DnsProvider => new MeProvider(o),
  'mit': (o: MitOptions): DnsProvider => new MitProvider(o),
  'moe': (o: MoeOptions): DnsProvider => new MoeProvider(o),
  'mozilla': (o: MozillaOptions): DnsProvider => new MozillaProvider(o),
  'mydevil': (o: MydevilOptions): DnsProvider => new MydevilProvider(o),
  'mydnsjp': (o: MydnsjpOptions): DnsProvider => new MydnsjpProvider(o),
  'mythic': (o: MythicOptions): DnsProvider => new MythicProvider(o),
  'namecheap': (o: NamecheapOptions): DnsProvider => new NamecheapProvider(o),
  'namecom': (o: NamecomOptions): DnsProvider => new NamecomProvider(o),
  'namesilo': (o: NamesiloOptions): DnsProvider => new NamesiloProvider(o),
  'natro': (o: NatroOptions): DnsProvider => new NatroProvider(o),
  'nederhost': (o: NederhostOptions): DnsProvider => new NederhostProvider(o),
  'netcup': (o: NetcupOptions): DnsProvider => new NetcupProvider(o),
  'netlify': (o: NetlifyOptions): DnsProvider => new NetlifyProvider(o),
  'njalla': (o: NjallaOptions): DnsProvider => new NjallaProvider(o),
  'nsone': (o: NsoneOptions): DnsProvider => new NsoneProvider(o),
  'nw': (o: NwOptions): DnsProvider => new NwProvider(o),
  'oci': (o: OciOptions): DnsProvider => new OciProvider(o),
  'one': (o: OnecomOptions): DnsProvider => new OnecomProvider(o),
  'online': (o: OnlineOptions): DnsProvider => new OnlineProvider(o),
  'opends': (o: OpendsOptions): DnsProvider => new OpendsProvider(o),
  'ovh': (o: OvhOptions): DnsProvider => new OvhProvider(o),
  'pantheon': (o: PantheonOptions): DnsProvider => new PantheonProvider(o),
  'parkingcrew': (o: ParkingcrewOptions): DnsProvider => new ParkingcrewProvider(o),
  'pdd': (o: PddOptions): DnsProvider => new PddProvider(o),
  'pdns': (o: PowerdnsOptions): DnsProvider => new PowerdnsProvider(o),
  'pear': (o: PearOptions): DnsProvider => new PearProvider(o),
  'pleskxml': (o: PleskXmlOptions): DnsProvider => new PleskXmlProvider(o),
  'porkbun': (o: PorkbunOptions): DnsProvider => new PorkbunProvider(o),
  'py': (o: PyOptions): DnsProvider => new PyProvider(o),
  'qiniu': (o: QiniuOptions): DnsProvider => new QiniuProvider(o),
  'rackspace': (o: RackspaceOptions): DnsProvider => new RackspaceProvider(o),
  'rage4': (o: Rage4Options): DnsProvider => new Rage4Provider(o),
  'regru': (o: RegruOptions): DnsProvider => new RegruProvider(o),
  'ru': (o: RuOptions): DnsProvider => new RuProvider(o),
  'scaleway': (o: ScalewayOptions): DnsProvider => new ScalewayProvider(o),
  'schlund': (o: SchlundOptions): DnsProvider => new SchlundProvider(o),
  'sedo': (o: SedoOptions): DnsProvider => new SedoProvider(o),
  'selectel': (o: SelectelOptions): DnsProvider => new SelectelProvider(o),
  'selfhost': (o: SelfhostOptions): DnsProvider => new SelfhostProvider(o),
  'servercow': (o: ServercowOptions): DnsProvider => new ServercowProvider(o),
  'simply': (o: SimplyOptions): DnsProvider => new SimplyProvider(o),
  'sit': (o: SitOptions): DnsProvider => new SitProvider(o),
  'spaceship': (o: SpaceshipOptions): DnsProvider => new SpaceshipProvider(o),
  'tencent': (o: TencentOptions): DnsProvider => new TencentProvider(o),
  'timeweb': (o: TimewebOptions): DnsProvider => new TimewebProvider(o),
  'transip': (o: TransipOptions): DnsProvider => new TransipProvider(o),
  'uno': (o: UnoOptions): DnsProvider => new UnoProvider(o),
  'us': (o: UsOptions): DnsProvider => new UsProvider(o),
  'variomedia': (o: VariomediaOptions): DnsProvider => new VariomediaProvider(o),
  'veesp': (o: VeespOptions): DnsProvider => new VeespProvider(o),
  'vercel': (o: VercelOptions): DnsProvider => new VercelProvider(o),
  'vscale': (o: VscaleOptions): DnsProvider => new VscaleProvider(o),
  'vultr': (o: VultrOptions): DnsProvider => new VultrProvider(o),
  'websupport': (o: WebsupportOptions): DnsProvider => new WebsupportProvider(o),
  'world4you': (o: World4youOptions): DnsProvider => new World4youProvider(o),
  'yandex': (o: YandexOptions): DnsProvider => new YandexProvider(o),
  'zeru': (o: ZeruOptions): DnsProvider => new ZeruProvider(o),
  'zilore': (o: ZiloreOptions): DnsProvider => new ZiloreProvider(o),
  'zone': (o: ZoneOptions): DnsProvider => new ZoneProvider(o),
  'zonomi': (o: ZonomiOptions): DnsProvider => new ZonomiProvider(o),
} as const

export type ProviderId = keyof typeof PROVIDERS
type OptionsOf<K extends ProviderId> = Parameters<typeof PROVIDERS[K]>[0]

export function getProvider<K extends ProviderId>(
  id: K,
  options: OptionsOf<K>,
  ctx?: DnsProviderContext,
): DnsProvider {
  const factory = PROVIDERS[id] as ((o: OptionsOf<K>) => DnsProvider) | undefined
  if (!factory) throw new Error(`Unknown provider: ${id as string}`)
  const p = factory(options)
  if (ctx) p.setContext(ctx)
  return p
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
