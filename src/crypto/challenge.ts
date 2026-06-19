import { sha256Base64url } from './digest.ts'
import { publicKeyToJwkWithThumbprint } from './jwk.ts'

export async function computeDns01TxtValue(
  token: string,
  accountPublicKey: CryptoKey,
): Promise<string> {
  const { thumbprint } = await publicKeyToJwkWithThumbprint(accountPublicKey)
  const keyAuthorization = `${token}.${thumbprint}`
  return sha256Base64url(keyAuthorization)
}

export function challengeDomain(domain: string): string {
  return `_acme-challenge.${domain}`
}
