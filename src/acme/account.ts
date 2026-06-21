import { _signWithJwk, _signWithKid, _signEab } from '../crypto/index.ts'
import { _calcjwk } from '../crypto/jwk.ts'
import type { AcmeAccount } from './types.ts'
import type { AcmeHttp } from './http.ts'

export interface EabCredentials {
  kid: string
  hmacKey: string
}

// acme.sh L3850: _regAccount() — register ACME account
export async function _regAccount(
  http: AcmeHttp,
  ACME_NEW_ACCOUNT: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  contact?: string[],
  termsOfServiceAgreed: boolean = true,
  eab?: EabCredentials,
): Promise<{ account: AcmeAccount; kid: string }> {
  const payloadObj: Record<string, unknown> = {
    termsOfServiceAgreed,
  }
  // ponytail: only include contact when non-empty, matching acme.sh behavior (L3938-3940)
  if (contact?.length) {
    payloadObj.contact = contact
  }

  // acme.sh L3916-3936: EAB signature computation
  if (eab) {
    const jwk = await _calcjwk(publicKey)
    const eabJws = await _signEab(eab.kid, eab.hmacKey, jwk, ACME_NEW_ACCOUNT)
    payloadObj.externalAccountBinding = eabJws
  }

  const payload = JSON.stringify(payloadObj)

  const response = await http._send_signed_request<AcmeAccount>(
    ACME_NEW_ACCOUNT,
    (nonce) => _signWithJwk(privateKey, publicKey, payload, ACME_NEW_ACCOUNT, nonce),
  )

  const location = response.headers.get('location')
  if (!location) {
    throw new Error('No Location header in account registration response')
  }

  const account = { ...response.data, kid: location }
  return { account, kid: location }
}

// acme.sh L4738: getAccount logic (onlyReturnExisting lookup in issue())
export async function _getAccount(
  http: AcmeHttp,
  ACME_NEW_ACCOUNT: string,
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<{ account: AcmeAccount; kid: string }> {
  // Find existing account by sending onlyReturnExisting
  const payload = JSON.stringify({ onlyReturnExisting: true })

  const response = await http._send_signed_request<AcmeAccount>(
    ACME_NEW_ACCOUNT,
    (nonce) => _signWithJwk(privateKey, publicKey, payload, ACME_NEW_ACCOUNT, nonce),
  )

  const location = response.headers.get('location')
  if (!location) {
    throw new Error('No Location header in account lookup response')
  }

  const account = { ...response.data, kid: location }
  return { account, kid: location }
}
