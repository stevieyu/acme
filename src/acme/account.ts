import { signJwsWithJwkThumbprint, signJwsWithKid } from '../crypto/index.ts'
import type { AcmeAccount } from './types.ts'
import type { AcmeHttp } from './http.ts'

export async function registerAccount(
  http: AcmeHttp,
  newAccountUrl: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  contact?: string[],
  termsOfServiceAgreed: boolean = true,
): Promise<{ account: AcmeAccount; kid: string }> {
  const payload = JSON.stringify({
    termsOfServiceAgreed,
    contact: contact ?? [],
  })

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
