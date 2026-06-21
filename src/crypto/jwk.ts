import { _url_replace } from './digest.ts'

export interface JwkThumbprint {
  jwk: JsonWebKey
  thumbprint: string
}

// acme.sh L1740: _calcjwk() — export public key to JWK format
export async function _calcjwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key)
}

// _calcjwkWithThumbprint: compute JWK + thumbprint (used in challenge computation)
export async function _calcjwkWithThumbprint(key: CryptoKey): Promise<JwkThumbprint> {
  const jwk = await _calcjwk(key)
  const thumbprint = await __calc_account_thumbprint(jwk)
  return { jwk, thumbprint }
}

// acme.sh L3830: __calc_account_thumbprint() — compute JWK thumbprint per RFC 7638
export async function __calc_account_thumbprint(jwk: JsonWebKey): Promise<string> {
  let canonical: string
  if (jwk.kty === 'EC') {
    canonical = JSON.stringify({ crv: jwk.crv, kty: 'EC', x: jwk.x, y: jwk.y })
  } else if (jwk.kty === 'RSA') {
    canonical = JSON.stringify({ e: jwk.e, kty: 'RSA', n: jwk.n })
  } else {
    throw new Error(`Unsupported key type: ${jwk.kty}`)
  }
  const data = new TextEncoder().encode(canonical)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return _url_replace(hash)
}
