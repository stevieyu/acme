import { _signWithKid, csrToBase64url } from '../crypto/index.ts'
import type { AcmeOrder, AcmeAuthorization, AcmeChallenge } from './types.ts'
import type { AcmeHttp } from './http.ts'
import { AcmeError } from './errors.ts'
import { _sleep } from '../util/index.ts'

// acme.sh L4888: issue() — _send_signed_request ACME_NEW_ORDER
export async function _createOrder(
  http: AcmeHttp,
  ACME_NEW_ORDER: string,
  privateKey: CryptoKey,
  kid: string,
  domains: string[],
): Promise<AcmeOrder> {
  const identifiers = domains.map(d => ({ type: 'dns' as const, value: d }))
  const payload = JSON.stringify({ identifiers })

  const response = await http._send_signed_request<AcmeOrder>(
    ACME_NEW_ORDER,
    (nonce) => _signWithKid(privateKey, kid, payload, ACME_NEW_ORDER, nonce),
  )

  return response.data
}

// acme.sh L4945: issue() STEP 2 — _send_signed_request _authz_url
export async function _getAuthorization(
  http: AcmeHttp,
  authzUrl: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<AcmeAuthorization> {
  // GET via POST-as-GET
  const response = await http._send_signed_request<AcmeAuthorization>(
    authzUrl,
    (nonce) => _signWithKid(privateKey, kid, null, authzUrl, nonce),
  )

  return response.data
}

// acme.sh L5042: entry= ... _egrep_o "type":"dns-01"
export async function _getDns01Challenge(authz: AcmeAuthorization): Promise<AcmeChallenge> {
  const challenge = authz.challenges.find(c => c.type === 'dns-01')
  if (!challenge) {
    throw new AcmeError({ type: 'about:blank', detail: 'No dns-01 challenge found in authorization' })
  }
  return challenge
}

// acme.sh L4254: __trigger_validation() — trigger challenge validation
export async function __trigger_validation(
  http: AcmeHttp,
  challengeUrl: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<AcmeChallenge> {
  const response = await http._send_signed_request<AcmeChallenge>(
    challengeUrl,
    (nonce) => _signWithKid(privateKey, kid, JSON.stringify({}), challengeUrl, nonce),
  )
  return response.data
}

// acme.sh L5352-5441: issue() — verification status polling loop
export async function _pollAuthzStatus(
  http: AcmeHttp,
  challengeUrl: string,
  privateKey: CryptoKey,
  kid: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<AcmeChallenge> {
  const { timeoutMs = 120000, intervalMs = 2000 } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await http._send_signed_request<AcmeChallenge>(
      challengeUrl,
      (nonce) => _signWithKid(privateKey, kid, null, challengeUrl, nonce),
    )

    const challenge = response.data
    if (challenge.status === 'valid') return challenge
    if (challenge.status === 'invalid') {
      throw new AcmeError(challenge.error ?? { type: 'about:blank', detail: 'Challenge validation failed' })
    }

    await _sleep(intervalMs)
  }

  throw new AcmeError({ type: 'about:blank', detail: `Challenge polling timed out after ${timeoutMs}ms` })
}

// acme.sh L5451: issue() — _send_signed_request Le_OrderFinalize
export async function _finalizeOrder(
  http: AcmeHttp,
  Le_OrderFinalize: string,
  privateKey: CryptoKey,
  kid: string,
  csrPem: string,
): Promise<AcmeOrder> {
  const csr = csrToBase64url(csrPem)
  const payload = JSON.stringify({ csr })

  const response = await http._send_signed_request<AcmeOrder>(
    Le_OrderFinalize,
    (nonce) => _signWithKid(privateKey, kid, payload, Le_OrderFinalize, nonce),
  )

  return response.data
}

// acme.sh L5470-5523: issue() — poll order status until valid
export async function _pollOrderStatus(
  http: AcmeHttp,
  Le_LinkOrder: string,
  privateKey: CryptoKey,
  kid: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<AcmeOrder> {
  const { timeoutMs = 120000, intervalMs = 2000 } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await http._send_signed_request<AcmeOrder>(
      Le_LinkOrder,
      (nonce) => _signWithKid(privateKey, kid, null, Le_LinkOrder, nonce),
    )

    const order = response.data
    if (order.status === 'valid') return order
    if (order.status === 'invalid') {
      throw new AcmeError(order.error ?? { type: 'about:blank', detail: 'Order failed' })
    }

    await _sleep(intervalMs)
  }

  throw new AcmeError({ type: 'about:blank', detail: `Order polling timed out after ${timeoutMs}ms` })
}

// acme.sh L5538: issue() — _send_signed_request Le_LinkCert
export async function _downloadCert(
  http: AcmeHttp,
  Le_LinkCert: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<string> {
  const nonce = await http['noncePool'].pop(() => http._getNonce())
  const jws = await _signWithKid(privateKey, kid, null, Le_LinkCert, nonce)

  const response = await fetch(Le_LinkCert, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/jose+json',
      'Accept': 'application/pem-certificate-chain',
    },
    body: JSON.stringify(jws),
  })

  http['noncePool'].push(response.headers.get('replay-nonce'))

  if (!response.ok) {
    const body = await response.text()
    throw AcmeError.fromResponse(response.status, body)
  }

  return response.text()
}
