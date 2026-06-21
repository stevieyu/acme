import { _url_replace, _durl_replace_base64 } from './digest.ts'
import { _calcjwk } from './jwk.ts'

export interface JwsInput {
  privateKey: CryptoKey
  payload: string | null
  protectedHeader: Record<string, unknown>
}

export interface FlattenedJws {
  payload: string
  protected: string
  signature: string
}

// acme.sh L1106: _sign() — sign JWS payload with private key
export async function _sign(input: JwsInput): Promise<FlattenedJws> {
  const protectedHeader = _url_replace(new TextEncoder().encode(JSON.stringify(input.protectedHeader)))
  const payload = input.payload === null ? '' : _url_replace(new TextEncoder().encode(input.payload))
  const signingInput = `${protectedHeader}.${payload}`

  const alg = getSignAlgorithm(input.privateKey)
  const signature = await crypto.subtle.sign(alg, input.privateKey, new TextEncoder().encode(signingInput))

  let sigBytes: Uint8Array = new Uint8Array(signature as ArrayBuffer)
  // ECDSA: convert raw r||s to concatenated fixed-size
  if (input.privateKey.algorithm.name === 'ECDSA') {
    sigBytes = convertEcdsaSignature(sigBytes, input.privateKey)
  }

  return {
    payload,
    protected: protectedHeader,
    signature: _url_replace(sigBytes),
  }
}

// _signWithJwk: sign with JWK in header (for account registration)
export async function _signWithJwk(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  payload: string | null,
  url: string,
  nonce: string,
): Promise<FlattenedJws> {
  const jwk = await _calcjwk(publicKey)
  const protectedHeader: Record<string, unknown> = {
    alg: getJwsAlg(privateKey),
    jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, e: jwk.e, n: jwk.n },
    nonce,
    url,
  }
  // Remove undefined fields from jwk
  const jwkClean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(protectedHeader.jwk as Record<string, unknown>)) {
    if (v !== undefined) jwkClean[k] = v
  }
  protectedHeader.jwk = jwkClean
  return _sign({ privateKey, payload, protectedHeader })
}

// acme.sh L2238: _send_signed_request() uses kid-based signing for authenticated requests
export async function _signWithKid(
  privateKey: CryptoKey,
  kid: string,
  payload: string | null,
  url: string,
  nonce: string,
): Promise<FlattenedJws> {
  const protectedHeader: Record<string, unknown> = {
    alg: getJwsAlg(privateKey),
    kid,
    nonce,
    url,
  }
  return _sign({ privateKey, payload, protectedHeader })
}

// acme.sh L3916-3936: _regAccount() EAB signature — External Account Binding per RFC 8555 §7.3.4
export async function _signEab(
  eabKid: string,
  eabHmacKey: string,
  accountJwk: JsonWebKey,
  url: string,
): Promise<FlattenedJws> {
  const keyBytes = _durl_replace_base64(eabHmacKey)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )

  // Filter JWK to public fields only
  const publicJwk = accountJwk.kty === 'EC'
    ? { crv: accountJwk.crv, kty: 'EC', x: accountJwk.x, y: accountJwk.y }
    : { e: accountJwk.e, kty: 'RSA', n: accountJwk.n }

  const protectedHeader = _url_replace(
    new TextEncoder().encode(JSON.stringify({ alg: 'HS256', kid: eabKid, url })),
  )
  const payload = _url_replace(new TextEncoder().encode(JSON.stringify(publicJwk)))
  const signingInput = `${protectedHeader}.${payload}`

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signingInput))

  return { payload, protected: protectedHeader, signature: _url_replace(signature) }
}

function getJwsAlg(key: CryptoKey): string {
  if (key.algorithm.name === 'ECDSA') {
    const curve = (key.algorithm as EcKeyAlgorithm).namedCurve
    switch (curve) {
      case 'P-256': return 'ES256'
      case 'P-384': return 'ES384'
      case 'P-521': return 'ES512'
      default: throw new Error(`Unsupported EC curve: ${curve}`)
    }
  }
  return 'RS256'
}

function getSignAlgorithm(key: CryptoKey): AlgorithmIdentifier | EcdsaParams | RsaHashedKeyGenParams {
  if (key.algorithm.name === 'ECDSA') {
    const curve = (key.algorithm as EcKeyAlgorithm).namedCurve
    const hash = curve === 'P-256' ? 'SHA-256' : curve === 'P-384' ? 'SHA-384' : 'SHA-512'
    return { name: 'ECDSA', hash }
  }
  return { name: 'RSASSA-PKCS1-v1_5' }
}

function convertEcdsaSignature(raw: Uint8Array, key: CryptoKey): Uint8Array {
  const curve = (key.algorithm as EcKeyAlgorithm).namedCurve
  const size = curve === 'P-256' ? 32 : curve === 'P-384' ? 48 : 66
  // Web Crypto ECDSA already returns r||s in fixed size for most implementations
  if (raw.length === size * 2) return raw
  // If DER-encoded, parse
  if (raw[0] === 0x30) return derToRaw(raw, size)
  return raw
}

function derToRaw(der: Uint8Array, size: number): Uint8Array {
  const result = new Uint8Array(size * 2)
  let offset = 2 // skip 0x30 + length
  if (der[1] & 0x80) offset += (der[1] & 0x7f)
  // r
  offset++ // skip 0x02
  const rLen = der[offset++]
  const rStart = offset + Math.max(0, rLen - size)
  const rPad = Math.max(0, size - rLen)
  result.set(der.subarray(rStart, offset + rLen), rPad)
  offset += rLen
  // s
  offset++ // skip 0x02
  const sLen = der[offset++]
  const sStart = offset + Math.max(0, sLen - size)
  const sPad = Math.max(0, size - sLen)
  result.set(der.subarray(sStart, offset + sLen), size + sPad)
  return result
}
