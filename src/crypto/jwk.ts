import { base64urlEncode } from './digest.ts'

export interface JwkThumbprint {
  jwk: JsonWebKey
  thumbprint: string
}

export async function publicKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key)
}

export async function publicKeyToJwkWithThumbprint(key: CryptoKey): Promise<JwkThumbprint> {
  const jwk = await publicKeyToJwk(key)
  const thumbprint = await computeThumbprint(jwk)
  return { jwk, thumbprint }
}

export async function computeThumbprint(jwk: JsonWebKey): Promise<string> {
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
  return base64urlEncode(hash)
}
