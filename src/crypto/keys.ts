export type KeyType = 'ec-256' | 'ec-384' | 'ec-521' | 'rsa-2048' | 'rsa-3072' | 'rsa-4096'

export interface KeyPairResult {
  privateKey: CryptoKey
  publicKey: CryptoKey
  keyType: KeyType
}

export async function generateKeyPair(keyType: KeyType = 'ec-256'): Promise<KeyPairResult> {
  const algorithm = getKeyAlgorithm(keyType)
  const keyPair = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify'])
  return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, keyType }
}

function getKeyAlgorithm(keyType: KeyType): EcKeyGenParams | RsaHashedKeyGenParams {
  switch (keyType) {
    case 'ec-256': return { name: 'ECDSA', namedCurve: 'P-256' }
    case 'ec-384': return { name: 'ECDSA', namedCurve: 'P-384' }
    case 'ec-521': return { name: 'ECDSA', namedCurve: 'P-521' }
    case 'rsa-2048': return { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
    case 'rsa-3072': return { name: 'RSASSA-PKCS1-v1_5', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
    case 'rsa-4096': return { name: 'RSASSA-PKCS1-v1_5', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
  }
}
