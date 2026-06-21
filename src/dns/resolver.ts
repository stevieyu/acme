import type { DnsProvider } from '../providers/types.ts'
import type { Logger } from '../util/logger.ts'
import { _sleep } from '../util/retry.ts'
import { _check_dns_entries, __purge_txt } from './doh.ts'

export interface ResolveDns01Options {
  provider: DnsProvider
  domain: string
  txtValue: string
  logger: Logger
  propagationTimeoutMs?: number
  propagationIntervalMs?: number
  dnsSettleMs?: number
  dohTimeoutMs?: number
  dohMaxAttempts?: number
  skipPropagation?: boolean
}

// ponytail: acme.sh sleeps 20s before first DNS check.
const DEFAULT_SETTLE_MS = 20_000

export async function resolveDns01Challenge(options: ResolveDns01Options): Promise<void> {
  const {
    provider, domain, txtValue, logger,
    propagationTimeoutMs = 600_000,
    propagationIntervalMs = 10_000,
    dnsSettleMs = DEFAULT_SETTLE_MS,
    dohTimeoutMs,
    dohMaxAttempts,
    skipPropagation = false,
  } = options

  const fulldomain = `_acme-challenge.${domain}`

  logger.info(`creating TXT record: ${fulldomain}`)
  await provider.createTxtRecord({ logger }, { fulldomain, txtvalue: txtValue })

  if (skipPropagation) {
    logger.info('skipping DNS propagation check')
    return
  }

  // acme.sh L5205: "Sleeping for 20 seconds first" before DNS check
  logger.info(`waiting ${dnsSettleMs / 1000}s for DNS to settle before checking...`)
  await _sleep(dnsSettleMs)

  // acme.sh L4463: __purge_txt before each retry
  await __purge_txt(fulldomain, dohTimeoutMs)

  const maxAttempts = dohMaxAttempts ?? Math.ceil(propagationTimeoutMs / propagationIntervalMs)
  logger.info(`checking DNS propagation: ${fulldomain} (timeout ${propagationTimeoutMs / 1000}s, interval ${propagationIntervalMs / 1000}s, maxAttempts ${maxAttempts})`)

  const propagated = await _check_dns_entries(fulldomain, txtValue, {
    intervalMs: propagationIntervalMs,
    maxAttempts,
    dohTimeoutMs,
    logger,
  })

  if (!propagated) {
    logger.warn(`DNS propagation timeout after ${propagationTimeoutMs / 1000}s for ${fulldomain}, proceeding anyway`)
  } else {
    logger.info(`DNS propagation confirmed for ${fulldomain}`)
  }
}

export async function cleanupDns01(options: {
  provider: DnsProvider
  domain: string
  txtValue: string
  logger: Logger
}): Promise<void> {
  const { provider, domain, txtValue, logger } = options
  const fulldomain = `_acme-challenge.${domain}`

  try {
    await provider.deleteTxtRecord({ logger }, { fulldomain, txtvalue: txtValue })
    logger.info(`cleaned up TXT record: ${fulldomain}`)
  } catch (err) {
    logger.warn(`failed to cleanup TXT record: ${fulldomain}`, err)
  }
}
