import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair } from '../../src/crypto/keys.ts'
import { signJwsWithJwkThumbprint, signJwsWithKid } from '../../src/crypto/jws.ts'
import { base64urlDecode } from '../../src/crypto/digest.ts'

describe('JWS', () => {
  it('signs with JWK thumbprint header (EC P-256)', async () => {
    const kp = await generateKeyPair('ec-256')
    const jws = await signJwsWithJwkThumbprint(
      kp.privateKey, kp.publicKey, '{"test":1}', 'https://example.com', 'nonce123',
    )

    assert.ok(jws.payload)
    assert.ok(jws.protected)
    assert.ok(jws.signature)

    // Verify protected header contains jwk and nonce
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(jws.protected)))
    assert.equal(header.alg, 'ES256')
    assert.equal(header.nonce, 'nonce123')
    assert.equal(header.url, 'https://example.com')
    assert.equal(header.jwk.kty, 'EC')
    assert.equal(header.jwk.crv, 'P-256')
  })

  it('signs with kid header (EC P-256)', async () => {
    const kp = await generateKeyPair('ec-256')
    const jws = await signJwsWithKid(
      kp.privateKey, 'https://acme.example.com/acme/acct/1',
      '{"identifiers":[]}', 'https://acme.example.com/acme/order', 'nonce456',
    )

    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(jws.protected)))
    assert.equal(header.alg, 'ES256')
    assert.equal(header.kid, 'https://acme.example.com/acme/acct/1')
    assert.equal(header.nonce, 'nonce456')
  })

  it('handles null payload (POST-as-GET)', async () => {
    const kp = await generateKeyPair('ec-256')
    const jws = await signJwsWithKid(
      kp.privateKey, 'https://acme.example.com/acme/acct/1',
      null, 'https://acme.example.com/acme/authz/1', 'nonce789',
    )

    assert.equal(jws.payload, '')
  })

  it('signs with RSA key', async () => {
    const kp = await generateKeyPair('rsa-2048')
    const jws = await signJwsWithJwkThumbprint(
      kp.privateKey, kp.publicKey, '{"test":true}', 'https://example.com', 'nonce-rsa',
    )

    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(jws.protected)))
    assert.equal(header.alg, 'RS256')
    assert.equal(header.jwk.kty, 'RSA')
    assert.ok(jws.signature)
  })
})
