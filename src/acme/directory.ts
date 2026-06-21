import type { AcmeDirectory } from './types.ts'

// acme.sh L40-48: CA_NAMES — known CA directory names
/** Known CA directory names */
export type CaName =
  | 'letsencrypt' | 'letsencrypt_test'
  | 'zerossl'
  | 'google' | 'google_test'
  | 'sslcom' | 'sslcom-ecc'
  | 'actalis'

// acme.sh L23-37: CA_ZEROSSL, CA_LETSENCRYPT_V2, etc.
const CA_SERVERS_MAP: Record<CaName, string> = {
  'letsencrypt': 'https://acme-v02.api.letsencrypt.org/directory',
  'letsencrypt_test': 'https://acme-staging-v02.api.letsencrypt.org/directory',
  'zerossl': 'https://acme.zerossl.com/v2/DV90',
  'google': 'https://dv.acme-v02.api.pki.goog/directory',
  'google_test': 'https://dv.acme-v02.test-api.pki.goog/directory',
  'sslcom': 'https://acme.ssl.com/sslcom-dv-rsa',
  'sslcom-ecc': 'https://acme.ssl.com/sslcom-dv-ecc',
  'actalis': 'https://acme-api.actalis.com/acme/directory',
}

// acme.sh L50: CA_SERVERS — well-known CA directory URLs
/** Well-known CA directory URLs. Pass a `CaName` for completion, or any custom URL string. */
export const CA_SERVERS: Readonly<Record<CaName, string>> = CA_SERVERS_MAP

// Resolves CA name or URL to directory URL (acme.sh _initAPI uses ACME_DIRECTORY)
export function getDirectoryUrl(nameOrUrl: CaName | (string & {})): string {
  return (CA_SERVERS_MAP as Record<string, string>)[nameOrUrl] ?? nameOrUrl
}

// acme.sh L2878: _initAPI() — fetch ACME directory endpoints
export async function _initAPI(url: string): Promise<AcmeDirectory> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ACME directory: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<AcmeDirectory>
}
