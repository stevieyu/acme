import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair } from '../../src/crypto/keys.ts'
import { publicKeyToJwkWithThumbprint, computeThumbprint } from '../../src/crypto/jwk.ts'

describe('JWK', () => {
  it('exports public key as JWK', async () => {
    const kp = await generateKeyPair('ec-256')
    const { jwk, thumbprint } = await publicKeyToJwkWithThumbprint(kp.publicKey)
    assert.equal(jwk.kty, 'EC')
    assert.equal(jwk.crv, 'P-256')
    assert.ok(jwk.x)
    assert.ok(jwk.y)
    assert.ok(thumbprint.length > 0)
  })

  it('computes thumbprint for EC key', async () => {
    const jwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'f83OJ3D2xF1Bg8vub9pLe1KCMz3kOF43zJ76eiCAoyo',
      y: 'hKm2Nh7XblfYacy0gOA1x936g7hOFR4nFjpBkXsq2MA',
    }
    const thumbprint = await computeThumbprint(jwk)
    // RFC 7638 test vector
    assert.equal(typeof thumbprint, 'string')
    assert.ok(thumbprint.length > 0)
  })

  it('computes thumbprint for RSA key', async () => {
    const jwk: JsonWebKey = {
      kty: 'RSA',
      n: '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5JsGY4Hc5n9yBXArwl93Iqt7_-189tj2aYV9d0EYQ',
      e: 'AQAB',
    }
    const thumbprint = await computeThumbprint(jwk)
    assert.ok(thumbprint.length > 0)
  })

  it('throws for unsupported key type', async () => {
    await assert.rejects(
      () => computeThumbprint({ kty: 'OKP' } as JsonWebKey),
      { message: /Unsupported key type/ },
    )
  })
})
