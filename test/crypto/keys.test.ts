import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { _createkey } from '../../src/crypto/keys.ts'

describe('_createkey', () => {
  it('generates EC P-256 key pair', async () => {
    const kp = await _createkey('ec-256')
    assert.equal(kp.keyType, 'ec-256')
    assert.equal(kp.privateKey.algorithm.name, 'ECDSA')
    assert.equal((kp.privateKey.algorithm as EcKeyAlgorithm).namedCurve, 'P-256')
    assert.equal(kp.publicKey.algorithm.name, 'ECDSA')
  })

  it('generates EC P-384 key pair', async () => {
    const kp = await _createkey('ec-384')
    assert.equal(kp.keyType, 'ec-384')
    assert.equal((kp.privateKey.algorithm as EcKeyAlgorithm).namedCurve, 'P-384')
  })

  it('generates EC P-521 key pair', async () => {
    const kp = await _createkey('ec-521')
    assert.equal(kp.keyType, 'ec-521')
    assert.equal((kp.privateKey.algorithm as EcKeyAlgorithm).namedCurve, 'P-521')
  })

  it('generates RSA 2048 key pair', async () => {
    const kp = await _createkey('rsa-2048')
    assert.equal(kp.keyType, 'rsa-2048')
    assert.equal(kp.privateKey.algorithm.name, 'RSASSA-PKCS1-v1_5')
  })

  it('defaults to ec-256', async () => {
    const kp = await _createkey()
    assert.equal(kp.keyType, 'ec-256')
  })
})
