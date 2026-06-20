import type { AcmeDirectory } from './types.ts'

/** Known CA directory names */
export type CaName =
  | 'letsencrypt' | 'letsencrypt-staging'
  | 'zerossl'
  | 'google' | 'google-staging'
  | 'ssl-com'
  | 'buypass' | 'buypass-test'
  | 'pebble'

const caUrls: Record<CaName, string> = {
  'letsencrypt': 'https://acme-v02.api.letsencrypt.org/directory',
  'letsencrypt-staging': 'https://acme-staging-v02.api.letsencrypt.org/directory',
  'zerossl': 'https://acme.zerossl.com/v2/DV90',
  'google': 'https://dv.acme-v3.pki.goog/directory',
  'google-staging': 'https://dv.acme-v3.pki.goog/directory',
  'ssl-com': 'https://acme.ssl.com/sslcom-dv-rsa',
  'buypass': 'https://api.buypass.com/acme/directory',
  'buypass-test': 'https://api.test4.buypass.no/acme/directory',
  'pebble': 'https://localhost:14000/dir',
}

/** Well-known CA directory URLs. Pass a `CaName` for completion, or any custom URL string. */
export const CA_URLS: Readonly<Record<CaName, string>> = caUrls

export function getDirectoryUrl(nameOrUrl: CaName | (string & {})): string {
  return (caUrls as Record<string, string>)[nameOrUrl] ?? nameOrUrl
}

export async function fetchDirectory(url: string): Promise<AcmeDirectory> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ACME directory: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<AcmeDirectory>
}
