import * as x509 from '@peculiar/x509'
import { _url_replace } from './digest.ts'

export interface CsrOptions {
  privateKey: CryptoKey
  publicKey: CryptoKey
  domains: string[]
}

// acme.sh L1286: _createcsr() — generate Certificate Signing Request
export async function _createcsr(options: CsrOptions): Promise<string> {
  const { privateKey, publicKey, domains } = options
  const cn = domains[0]!

  const extensions: x509.Extension[] = [
    new x509.SubjectAlternativeNameExtension(
      domains.map((d): x509.JsonGeneralName => ({ type: 'dns', value: d })),
      false,
    ),
  ]

  const csr = await x509.Pkcs10CertificateRequestGenerator.create({
    name: `CN=${cn}`,
    keys: { publicKey, privateKey },
    extensions,
    signingAlgorithm: getSigningAlgorithm(privateKey),
  })

  return csr.toString('pem')
}

export function csrToDer(csrPem: string): Uint8Array {
  const base64 = csrPem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s/g, '')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

// acme.sh L5447: der="$(_getfile "${CSR_PATH}" ... | tr -d "\r\n" | _url_replace)"
export function csrToBase64url(csrPem: string): string {
  return _url_replace(csrToDer(csrPem))
}

function getSigningAlgorithm(key: CryptoKey): EcdsaParams {
  if (key.algorithm.name === 'ECDSA') {
    const curve = (key.algorithm as EcKeyAlgorithm).namedCurve
    const hash = curve === 'P-256' ? 'SHA-256' : curve === 'P-384' ? 'SHA-384' : 'SHA-512'
    return { name: 'ECDSA', hash }
  }
  return { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
}
