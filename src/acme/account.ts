import { signJwsWithJwkThumbprint, signJwsWithKid, signEab } from '../crypto/index.ts'
import { publicKeyToJwk } from '../crypto/jwk.ts'
import type { AcmeAccount } from './types.ts'
import type { AcmeHttp } from './http.ts'

export interface EabCredentials {
  kid: string
  hmacKey: string
}

export async function registerAccount(
  http: AcmeHttp,
  newAccountUrl: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  contact?: string[],
  termsOfServiceAgreed: boolean = true,
  eab?: EabCredentials,
): Promise<{ account: AcmeAccount; kid: string }> {
  const payloadObj: Record<string, unknown> = {
    termsOfServiceAgreed,
    contact: contact ?? [],
  }

  // EAB: sign the account JWK with HMAC key and embed as externalAccountBinding
  if (eab) {
    const jwk = await publicKeyToJwk(publicKey)
    const eabJws = await signEab(eab.kid, eab.hmacKey, jwk, newAccountUrl)
    payloadObj.externalAccountBinding = eabJws
  }

  const payload = JSON.stringify(payloadObj)

  const response = await http.signedRequest<AcmeAccount>(
    newAccountUrl,
    (nonce) => signJwsWithJwkThumbprint(privateKey, publicKey, payload, newAccountUrl, nonce),
  )

  const location = response.headers.get('location')
  if (!location) {
    throw new Error('No Location header in account registration response')
  }

  const account = { ...response.data, kid: location }
  return { account, kid: location }
}

export async function getAccount(
  http: AcmeHttp,
  newAccountUrl: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<{ account: AcmeAccount; kid: string }> {
  // Find existing account by sending onlyReturnExisting
  const payload = JSON.stringify({ onlyReturnExisting: true })

  const response = await http.signedRequest<AcmeAccount>(
    newAccountUrl,
    (nonce) => signJwsWithJwkThumbprint(privateKey, publicKey, payload, newAccountUrl, nonce),
  )

  const location = response.headers.get('location')
  if (!location) {
    throw new Error('No Location header in account lookup response')
  }

  const account = { ...response.data, kid: location }
  return { account, kid: location }
}
