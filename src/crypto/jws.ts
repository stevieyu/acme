import { base64urlEncode } from './digest.ts'
import { publicKeyToJwk, computeThumbprint } from './jwk.ts'

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

export async function signJws(input: JwsInput): Promise<FlattenedJws> {
  const protectedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(input.protectedHeader)))
  const payload = input.payload === null ? '' : base64urlEncode(new TextEncoder().encode(input.payload))
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
    signature: base64urlEncode(sigBytes),
  }
}

export async function signJwsWithJwkThumbprint(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  payload: string | null,
  url: string,
  nonce: string,
): Promise<FlattenedJws> {
  const jwk = await publicKeyToJwk(publicKey)
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
  return signJws({ privateKey, payload, protectedHeader })
}

export async function signJwsWithKid(
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
  return signJws({ privateKey, payload, protectedHeader })
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
