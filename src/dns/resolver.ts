import type { DnsProvider } from '../providers/types.ts'
import type { Logger } from '../util/logger.ts'
import { checkDnsPropagation } from './doh.ts'
import { purgeDohCache } from './purge.ts'

export interface ResolveDns01Options {
  provider: DnsProvider
  domain: string
  txtValue: string
  logger: Logger
  propagationTimeoutMs?: number
  propagationIntervalMs?: number
  skipPropagation?: boolean
}

export async function resolveDns01Challenge(options: ResolveDns01Options): Promise<void> {
  const {
    provider, domain, txtValue, logger,
    propagationTimeoutMs = 120000,
    propagationIntervalMs = 5000,
    skipPropagation = false,
  } = options

  const fulldomain = `_acme-challenge.${domain}`

  logger.info(`creating TXT record: ${fulldomain}`)
  await provider.createTxtRecord({ logger }, { fulldomain, txtvalue: txtValue })

  if (skipPropagation) {
    logger.info('skipping DNS propagation check')
    return
  }

  // Purge caches before checking
  await purgeDohCache(fulldomain)

  logger.info(`waiting for DNS propagation: ${fulldomain}`)
  const propagated = await checkDnsPropagation(fulldomain, txtValue, {
    intervalMs: propagationIntervalMs,
    maxAttempts: Math.ceil(propagationTimeoutMs / propagationIntervalMs),
  })

  if (!propagated) {
    logger.warn(`DNS propagation timeout for ${fulldomain}, proceeding anyway`)
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
