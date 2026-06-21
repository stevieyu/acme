import { _digestUrlReplace } from './digest.ts'
import { _calcjwkWithThumbprint } from './jwk.ts'

// acme.sh L5136: txt="$(printf "%s" "$keyauthorization" | _digest "sha256" | _url_replace)"
export async function _digestTxt(
  token: string,
  accountPublicKey: CryptoKey,
): Promise<string> {
  const { thumbprint } = await _calcjwkWithThumbprint(accountPublicKey)
  const keyauthorization = `${token}.${thumbprint}`
  return _digestUrlReplace(keyauthorization)
}

// acme.sh L5131: txtdomain="_acme-challenge.$_dns_root_d"
export function challengeDomain(domain: string): string {
  return `_acme-challenge.${domain}`
}
