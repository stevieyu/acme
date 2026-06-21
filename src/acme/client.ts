import { _createkey, _createcsr, _digestTxt } from '../crypto/index.ts'
import type { KeyType } from '../crypto/keys.ts'
import { createLogger } from '../util/logger.ts'
import type { Logger, LogLevel } from '../util/logger.ts'
import type { DnsProvider } from '../providers/types.ts'
import { NoncePool } from './nonce.ts'
import { AcmeHttp } from './http.ts'
import type { CaName } from './directory.ts'
import { _initAPI, getDirectoryUrl } from './directory.ts'
import { _regAccount, _getAccount } from './account.ts'
import type { EabCredentials } from './account.ts'
import {
  _createOrder, _getAuthorization, _getDns01Challenge,
  __trigger_validation, _pollAuthzStatus, _finalizeOrder,
  _pollOrderStatus, _downloadCert,
} from './order.ts'
import type { AcmeDirectory, AcmeOrder, AcmeAuthorization, AcmeChallenge } from './types.ts'
import { AcmeError } from './errors.ts'
import { _check_dns_entries, __purge_txt } from '../dns/doh.ts'
import { _sleep } from '../util/retry.ts'

// acme.sh L29-30: CA_SSLCOM_RSA / CA_SSLCOM_ECC
// ponytail: acme.sh auto-switches SSL.com RSA→ECC endpoint when key type is ECC
const CA_SSLCOM_RSA = 'https://acme.ssl.com/sslcom-dv-rsa'
const CA_SSLCOM_ECC = 'https://acme.ssl.com/sslcom-dv-ecc'

// ponytail: acme.sh sleeps 20s before first DNS check (L5205).
const INITIAL_SETTLE_MS = 20_000

export interface AcmeClientOptions {
  directoryUrl: CaName | (string & {})
  accountContact?: string[]
  accountKey?: CryptoKeyPair
  eab?: EabCredentials
  logger?: LogLevel | Logger
  termsOfServiceAgreed?: boolean
}

export interface IssueCertificateOptions {
  domains: string[]
  keyType?: KeyType
  dns: DnsProvider
  /** Total time to wait for DNS propagation (default: 600s) */
  propagationTimeoutMs?: number
  /** Interval between DNS checks (default: 10s) */
  propagationIntervalMs?: number
  /** Wait time before first DNS check (default: 20s, acme.sh behavior) */
  dnsSettleMs?: number
  /** Single DoH request timeout (default: 10s) */
  dohTimeoutMs?: number
  /** Override max polling attempts (default: propagationTimeoutMs / propagationIntervalMs) */
  dohMaxAttempts?: number
}

// acme.sh L4604: issue() result
export interface IssueResult {
  fullchain: string
  privateKey: string
  certificate: string
}

// acme.sh L4604: issue() — main certificate issuance flow
export class AcmeClient {
  private logger: Logger
  private ACME_DIRECTORY: string
  private accountContact?: string[]
  private accountKeyPair?: CryptoKeyPair
  private eab?: EabCredentials
  private termsOfServiceAgreed: boolean
  private directory?: AcmeDirectory
  private http?: AcmeHttp
  private noncePool?: NoncePool
  private ACCOUNT_URL?: string

  constructor(options: AcmeClientOptions) {
    this.logger = createLogger(options.logger ?? 'info')
    this.ACME_DIRECTORY = getDirectoryUrl(options.directoryUrl)
    this.accountContact = options.accountContact
    this.eab = options.eab
    this.termsOfServiceAgreed = options.termsOfServiceAgreed ?? true
    if (options.accountKey) {
      this.accountKeyPair = options.accountKey
    }
  }

  // acme.sh L2878: _initAPI() — fetch ACME directory
  private async _initAPI(): Promise<AcmeDirectory> {
    if (!this.directory) {
      this.directory = await _initAPI(this.ACME_DIRECTORY)
      this.logger.info('fetched ACME directory', this.ACME_DIRECTORY)
    }
    return this.directory
  }

  private async _ensureHttp(): Promise<AcmeHttp> {
    if (!this.http) {
      const dir = await this._initAPI()
      this.noncePool = new NoncePool(this.logger)
      this.http = new AcmeHttp(this.noncePool, dir.newNonce, this.logger)
    }
    return this.http
  }

  // acme.sh L4738: account lookup / _regAccount logic in issue()
  private async _ensureAccount(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; kid: string }> {
    if (this.ACCOUNT_URL && this.accountKeyPair) {
      return {
        privateKey: this.accountKeyPair.privateKey,
        publicKey: this.accountKeyPair.publicKey,
        kid: this.ACCOUNT_URL,
      }
    }

    const http = await this._ensureHttp()

    if (!this.accountKeyPair) {
      const kp = await _createkey('ec-256')
      this.accountKeyPair = { privateKey: kp.privateKey, publicKey: kp.publicKey }
    }

    // Try to find existing account first
    try {
      const { kid } = await _getAccount(http, this.directory!.newAccount, this.accountKeyPair.privateKey, this.accountKeyPair.publicKey)
      this.ACCOUNT_URL = kid
      this.logger.info('found existing account', kid)
    } catch {
      // acme.sh L3850: _regAccount — register new account
      const { kid } = await _regAccount(
        http, this.directory!.newAccount,
        this.accountKeyPair.privateKey, this.accountKeyPair.publicKey,
        this.accountContact, this.termsOfServiceAgreed, this.eab,
      )
      this.ACCOUNT_URL = kid
      this.logger.info('registered new account', kid)
    }

    return {
      privateKey: this.accountKeyPair.privateKey,
      publicKey: this.accountKeyPair.publicKey,
      kid: this.ACCOUNT_URL!,
    }
  }

  // acme.sh L4604: issue() — main certificate issuance entry point
  async issue(options: IssueCertificateOptions): Promise<IssueResult> {
    const {
      domains, keyType = 'ec-256', dns,
      propagationTimeoutMs = 600_000,
      propagationIntervalMs = 10_000,
      dnsSettleMs = INITIAL_SETTLE_MS,
      dohTimeoutMs,
      dohMaxAttempts,
    } = options

    // ponytail: acme.sh auto-switches SSL.com RSA→ECC endpoint for EC key types
    if (keyType.startsWith('ec') && this.ACME_DIRECTORY === CA_SSLCOM_RSA) {
      this.logger.info('switching SSL.com endpoint from RSA to ECC for EC key type')
      this.ACME_DIRECTORY = CA_SSLCOM_ECC
      this.directory = undefined
      this.http = undefined
      this.noncePool = undefined
      this.ACCOUNT_URL = undefined
    }

    const http = await this._ensureHttp()
    const dir = await this._initAPI()
    const account = await this._ensureAccount()

    this.logger.info(`issuing certificate for ${domains.join(', ')}`)

    // acme.sh L4888: STEP 1 — create order
    const order = await _createOrder(http, dir.newOrder, account.privateKey, account.kid, domains)
    this.logger.info(`order created, status: ${order.status}`)

    // acme.sh L4940: STEP 2 — get authorizations
    for (const authzUrl of order.authorizations) {
      const authz = await _getAuthorization(http, authzUrl, account.privateKey, account.kid)
      const challenge = await _getDns01Challenge(authz)

      if (challenge.status === 'valid') {
        this.logger.info(`authz for ${authz.identifier.value} already valid`)
        continue
      }

      // acme.sh L5136: txt="$(printf "%s" "$keyauthorization" | _digest "sha256" | _url_replace)"
      const txt = await _digestTxt(challenge.token, account.publicKey)
      // acme.sh L5131: txtdomain="_acme-challenge.$_dns_root_d"
      const _dns_root_d = authz.identifier.value
      const domain = authz.wildcard ? `*._dns_root_d` : _dns_root_d
      const txtdomain = `_acme-challenge.${_dns_root_d}`

      this.logger.info(`creating DNS TXT record: ${txtdomain} = ${txt}`)

      try {
        // acme.sh L5170: addcommand "$txtdomain" "$txt"
        await dns.createTxtRecord(
          { logger: this.logger },
          { fulldomain: txtdomain, txtvalue: txt },
        )

        // acme.sh L5205: "Sleeping for 20 seconds first" before DNS check
        this.logger.info(`waiting ${dnsSettleMs / 1000}s for DNS to settle before checking...`)
        await _sleep(dnsSettleMs)
        await __purge_txt(txtdomain, dohTimeoutMs)
        const maxAttempts = dohMaxAttempts ?? Math.ceil(propagationTimeoutMs / propagationIntervalMs)
        this.logger.info(`checking DNS propagation: ${txtdomain} (timeout ${propagationTimeoutMs / 1000}s, interval ${propagationIntervalMs / 1000}s, maxAttempts ${maxAttempts})`)
        const propagated = await _check_dns_entries(txtdomain, txt, {
          intervalMs: propagationIntervalMs,
          maxAttempts,
          dohTimeoutMs,
          logger: this.logger,
        })
        if (!propagated) {
          this.logger.warn(`DNS propagation timeout after ${propagationTimeoutMs / 1000}s for ${txtdomain}, proceeding anyway`)
        } else {
          this.logger.info(`DNS propagation confirmed for ${txtdomain}`)
        }

        // acme.sh L4254: __trigger_validation
        await __trigger_validation(http, challenge.url, account.privateKey, account.kid)
        this.logger.info(`challenge answered for ${domain}`)

        // acme.sh L5352: poll authz status
        await _pollAuthzStatus(http, challenge.url, account.privateKey, account.kid, { timeoutMs: 120000, intervalMs: 2000 })
        this.logger.info(`challenge validated for ${domain}`)
      } finally {
        // Cleanup TXT record
        try {
          await dns.deleteTxtRecord(
            { logger: this.logger },
            { fulldomain: txtdomain, txtvalue: txt },
          )
          this.logger.info(`cleaned up DNS TXT record: ${txtdomain}`)
        } catch (err) {
          this.logger.warn(`failed to cleanup DNS TXT record: ${txtdomain}`, err)
        }
      }
    }

    // acme.sh L1591: createDomainKey — generate domain key
    const domainKey = await _createkey(keyType)
    // acme.sh L1286: _createcsr — generate CSR
    const der = await _createcsr({
      privateKey: domainKey.privateKey,
      publicKey: domainKey.publicKey,
      domains,
    })

    // acme.sh L5451: finalize order with CSR
    this.logger.info('finalizing order with CSR')
    let finalizedOrder = await _finalizeOrder(http, order.finalize, account.privateKey, account.kid, der)
    this.logger.info(`order status after finalize: ${finalizedOrder.status}`)

    // acme.sh L5470-5523: poll order status if still processing
    // ponytail: finalize response may already contain valid status + certificate URL
    if (finalizedOrder.status === 'processing') {
      const Le_LinkOrder = order.finalize.replace(/\/finalize\/?$/, '')
      this.logger.info('order is processing, polling for completion...')
      finalizedOrder = await _pollOrderStatus(http, Le_LinkOrder, account.privateKey, account.kid, {
        timeoutMs: 120_000, intervalMs: 2000,
      })
    }

    if (finalizedOrder.status !== 'valid' || !finalizedOrder.certificate) {
      throw new AcmeError({ type: 'about:blank', detail: `Order ended with status "${finalizedOrder.status}", no certificate URL` })
    }

    // acme.sh L5538: download cert
    const fullchain = await _downloadCert(http, finalizedOrder.certificate, account.privateKey, account.kid)

    // Export private key as PEM
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', domainKey.privateKey)
    const privateKeyPem = toPem(pkcs8, 'PRIVATE KEY')

    this.logger.info('certificate issued successfully')

    // acme.sh L5760: _split_cert_chain — extract first cert from fullchain
    return {
      fullchain,
      privateKey: privateKeyPem,
      certificate: fullchain.split('-----END CERTIFICATE-----')[0] + '-----END CERTIFICATE-----\n',
    }
  }

  // Step-by-step API for advanced usage
  async _createOrder(domains: string[]): Promise<AcmeOrder> {
    const http = await this._ensureHttp()
    const dir = await this._initAPI()
    const account = await this._ensureAccount()
    return _createOrder(http, dir.newOrder, account.privateKey, account.kid, domains)
  }

  async _getAuthorization(authzUrl: string): Promise<AcmeAuthorization> {
    const http = await this._ensureHttp()
    const account = await this._ensureAccount()
    return _getAuthorization(http, authzUrl, account.privateKey, account.kid)
  }

  async __trigger_validation(dns: DnsProvider, authz: AcmeAuthorization): Promise<AcmeChallenge> {
    const http = await this._ensureHttp()
    const account = await this._ensureAccount()
    const challenge = await _getDns01Challenge(authz)
    const txt = await _digestTxt(challenge.token, account.publicKey)
    const txtdomain = `_acme-challenge.${authz.identifier.value}`

    await dns.createTxtRecord({ logger: this.logger }, { fulldomain: txtdomain, txtvalue: txt })
    const result = await __trigger_validation(http, challenge.url, account.privateKey, account.kid)
    return result
  }

  async _pollAuthzStatus(challengeUrl: string): Promise<AcmeChallenge> {
    const http = await this._ensureHttp()
    const account = await this._ensureAccount()
    return _pollAuthzStatus(http, challengeUrl, account.privateKey, account.kid)
  }

  async _finalizeOrder(order: AcmeOrder, csrPem: string): Promise<AcmeOrder> {
    const http = await this._ensureHttp()
    const account = await this._ensureAccount()
    return _finalizeOrder(http, order.finalize, account.privateKey, account.kid, csrPem)
  }

  async _downloadCert(Le_LinkCert: string): Promise<string> {
    const http = await this._ensureHttp()
    const account = await this._ensureAccount()
    return _downloadCert(http, Le_LinkCert, account.privateKey, account.kid)
  }
}

function toPem(der: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(der)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  const b64 = btoa(binary)
  const lines = b64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`
}
