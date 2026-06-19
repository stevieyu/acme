import { signJwsWithKid, csrToBase64url } from '../crypto/index.ts'
import type { AcmeOrder, AcmeAuthorization, AcmeChallenge } from './types.ts'
import type { AcmeHttp } from './http.ts'
import { AcmeError } from './errors.ts'
import { sleep } from '../util/index.ts'

export async function createOrder(
  http: AcmeHttp,
  newOrderUrl: string,
  privateKey: CryptoKey,
  kid: string,
  domains: string[],
): Promise<AcmeOrder> {
  const identifiers = domains.map(d => ({ type: 'dns' as const, value: d }))
  const payload = JSON.stringify({ identifiers })

  const response = await http.signedRequest<AcmeOrder>(
    newOrderUrl,
    (nonce) => signJwsWithKid(privateKey, kid, payload, newOrderUrl, nonce),
  )

  return response.data
}

export async function getAuthorization(
  http: AcmeHttp,
  authzUrl: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<AcmeAuthorization> {
  // GET via POST-as-GET
  const response = await http.signedRequest<AcmeAuthorization>(
    authzUrl,
    (nonce) => signJwsWithKid(privateKey, kid, null, authzUrl, nonce),
  )

  return response.data
}

export async function getDns01Challenge(authz: AcmeAuthorization): Promise<AcmeChallenge> {
  const challenge = authz.challenges.find(c => c.type === 'dns-01')
  if (!challenge) {
    throw new AcmeError({ type: 'about:blank', detail: 'No dns-01 challenge found in authorization' })
  }
  return challenge
}

export async function answerChallenge(
  http: AcmeHttp,
  challengeUrl: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<AcmeChallenge> {
  const response = await http.signedRequest<AcmeChallenge>(
    challengeUrl,
    (nonce) => signJwsWithKid(privateKey, kid, JSON.stringify({}), challengeUrl, nonce),
  )
  return response.data
}

export async function pollChallenge(
  http: AcmeHttp,
  challengeUrl: string,
  privateKey: CryptoKey,
  kid: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<AcmeChallenge> {
  const { timeoutMs = 120000, intervalMs = 2000 } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await http.signedRequest<AcmeChallenge>(
      challengeUrl,
      (nonce) => signJwsWithKid(privateKey, kid, null, challengeUrl, nonce),
    )

    const challenge = response.data
    if (challenge.status === 'valid') return challenge
    if (challenge.status === 'invalid') {
      throw new AcmeError(challenge.error ?? { type: 'about:blank', detail: 'Challenge validation failed' })
    }

    await sleep(intervalMs)
  }

  throw new AcmeError({ type: 'about:blank', detail: `Challenge polling timed out after ${timeoutMs}ms` })
}

export async function finalizeOrder(
  http: AcmeHttp,
  finalizeUrl: string,
  privateKey: CryptoKey,
  kid: string,
  csrPem: string,
): Promise<AcmeOrder> {
  const csr = csrToBase64url(csrPem)
  const payload = JSON.stringify({ csr })

  const response = await http.signedRequest<AcmeOrder>(
    finalizeUrl,
    (nonce) => signJwsWithKid(privateKey, kid, payload, finalizeUrl, nonce),
  )

  return response.data
}

export async function pollOrder(
  http: AcmeHttp,
  orderUrl: string,
  privateKey: CryptoKey,
  kid: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<AcmeOrder> {
  const { timeoutMs = 120000, intervalMs = 2000 } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const response = await http.signedRequest<AcmeOrder>(
      orderUrl,
      (nonce) => signJwsWithKid(privateKey, kid, null, orderUrl, nonce),
    )

    const order = response.data
    if (order.status === 'valid') return order
    if (order.status === 'invalid') {
      throw new AcmeError(order.error ?? { type: 'about:blank', detail: 'Order failed' })
    }

    await sleep(intervalMs)
  }

  throw new AcmeError({ type: 'about:blank', detail: `Order polling timed out after ${timeoutMs}ms` })
}

export async function downloadCertificate(
  http: AcmeHttp,
  certificateUrl: string,
  privateKey: CryptoKey,
  kid: string,
): Promise<string> {
  const nonce = await http['noncePool'].pop(() => http.fetchNonce())
  const jws = await signJwsWithKid(privateKey, kid, null, certificateUrl, nonce)

  const response = await fetch(certificateUrl, {
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
