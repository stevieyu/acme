import type { AcmeDirectory } from './types.ts'

/** Known CA directory names */
export type CaName =
  | 'letsencrypt' | 'letsencrypt_test'
  | 'zerossl'
  | 'google' | 'google_test'
  | 'sslcom' | 'sslcom-ecc'
  | 'actalis'

const caUrls: Record<CaName, string> = {
  'letsencrypt': 'https://acme-v02.api.letsencrypt.org/directory',
  'letsencrypt_test': 'https://acme-staging-v02.api.letsencrypt.org/directory',
  'zerossl': 'https://acme.zerossl.com/v2/DV90',
  'google': 'https://dv.acme-v02.api.pki.goog/directory',
  'google_test': 'https://dv.acme-v02.test-api.pki.goog/directory',
  'sslcom': 'https://acme.ssl.com/sslcom-dv-rsa',
  'sslcom-ecc': 'https://acme.ssl.com/sslcom-dv-ecc',
  'actalis': 'https://acme-api.actalis.com/acme/directory',
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
