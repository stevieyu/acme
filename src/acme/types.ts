// RFC 8555 types

export interface AcmeDirectory {
  newNonce: string
  newAccount: string
  newOrder: string
  newAuthz?: string
  revokeCert: string
  keyChange: string
  meta?: AcmeDirectoryMeta
}

export interface AcmeDirectoryMeta {
  termsOfService?: string
  website?: string
  caaIdentities?: string[]
  externalAccountRequired?: boolean
}

export interface AcmeAccount {
  status: 'valid' | 'deactivated' | 'revoked'
  contact?: string[]
  termsOfServiceAgreed?: boolean
  orders?: string
  kid?: string  // Key ID URL, set after registration
}

export interface AcmeOrder {
  status: 'pending' | 'ready' | 'processing' | 'valid' | 'invalid'
  expires?: string
  identifiers: AcmeIdentifier[]
  notBefore?: string
  notAfter?: string
  authorizations: string[]
  finalize: string
  certificate?: string
  error?: AcmeProblem
}

export interface AcmeIdentifier {
  type: 'dns'
  value: string
}

export interface AcmeAuthorization {
  status: 'pending' | 'valid' | 'invalid' | 'deactivated' | 'expired' | 'revoked'
  expires?: string
  identifier: AcmeIdentifier
  challenges: AcmeChallenge[]
  wildcard?: boolean
}

export interface AcmeChallenge {
  type: 'dns-01' | 'http-01' | 'tls-alpn-01'
  url: string
  token: string
  status: 'pending' | 'processing' | 'valid' | 'invalid'
  validated?: string
  error?: AcmeProblem
}

export interface AcmeProblem {
  type: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  subproblems?: AcmeSubproblem[]
}

export interface AcmeSubproblem extends AcmeProblem {
  identifier?: AcmeIdentifier
}
