// @stvy/acme - Pure TypeScript ACME v2 client SDK
// Public API entry point

export { AcmeClient } from './acme/client.ts'
export type { AcmeClientOptions, IssueCertificateOptions, CertificateResult } from './acme/client.ts'
export type { AcmeDirectory, AcmeAccount, AcmeOrder, AcmeAuthorization, AcmeChallenge } from './acme/types.ts'
export { AcmeError } from './acme/errors.ts'
export { CA_URLS } from './acme/directory.ts'
export type { CaName } from './acme/directory.ts'

export { generateKeyPair, generateCsr } from './crypto/index.ts'
export type { KeyType, KeyPairResult } from './crypto/keys.ts'

export { getProvider } from './providers/index.ts'
export type { ProviderId } from './providers/index.ts'
export type { DnsProvider, DnsProviderContext, TxtRecordInput } from './providers/types.ts'
export { HttpProviderBase } from './providers/base-http.ts'
export { HmacProviderBase } from './providers/base-hmac.ts'
export { XmlProviderBase } from './providers/base-xml.ts'

export { resolveDns01Challenge } from './dns/resolver.ts'
