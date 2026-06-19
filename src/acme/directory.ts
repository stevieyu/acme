import type { AcmeDirectory } from './types.ts'

export const CA_URLS: Record<string, string> = {
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

export function getDirectoryUrl(nameOrUrl: string): string {
  return CA_URLS[nameOrUrl] ?? nameOrUrl
}

export async function fetchDirectory(url: string): Promise<AcmeDirectory> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ACME directory: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<AcmeDirectory>
}
