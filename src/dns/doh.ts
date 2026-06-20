// DNS-over-HTTPS propagation checker
// Modeled after acme.sh's _check_dns_entries logic

import type { Logger } from '../util/logger.ts'

interface DohProvider {
  name: string
  endpoint: string
  hasPurge: boolean
}

const DOH_PROVIDERS: DohProvider[] = [
  { name: 'cloudflare', endpoint: 'https://cloudflare-dns.com/dns-query', hasPurge: true },
  { name: 'google', endpoint: 'https://dns.google/resolve', hasPurge: false },
  { name: 'ali', endpoint: 'https://dns.alidns.com/resolve', hasPurge: false },
  { name: 'dnspod', endpoint: 'https://doh.pub/dns-query', hasPurge: false },
]

// ponytail: DoH request timeout. acme.sh uses 10s.
const DOH_REQUEST_TIMEOUT_MS = 10_000

export async function checkDnsPropagation(
  domain: string,
  expectedValue: string,
  options: { intervalMs?: number; maxAttempts?: number; logger?: Logger } = {},
): Promise<boolean> {
  const { intervalMs = 10_000, maxAttempts = 120, logger } = options

  for (let i = 1; i <= maxAttempts; i++) {
    const result = await queryDoh(domain, expectedValue)
    if (result.found) {
      logger?.info(`DNS propagation confirmed via ${result.provider} (attempt ${i})`)
      return true
    }
    if (i < maxAttempts) {
      logger?.debug(`DNS not yet propagated (attempt ${i}/${maxAttempts}), checked via ${result.provider}. Waiting ${intervalMs / 1000}s...`)
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }

  return false
}

export async function queryDoh(
  domain: string,
  expectedValue: string,
): Promise<{ found: boolean; provider: string }> {
  // ponytail: try each provider sequentially, return on first match.
  // acme.sh selects one provider and sticks with it; we try all for resilience.
  for (const p of DOH_PROVIDERS) {
    try {
      const values = await resolveTxt(p.endpoint, domain)
      if (values.includes(expectedValue)) return { found: true, provider: p.name }
    } catch {
      // Try next provider
    }
  }
  return { found: false, provider: 'all' }
}

export async function purgeDohCache(domain: string): Promise<void> {
  // ponytail: only Cloudflare has a purge API. Best-effort for all providers.
  // acme.sh does the same: _ns_purge_cf for CF, sleep 5s for others.
  try {
    await fetch(
      `https://cloudflare-dns.com/api/v1/purge?domain=${encodeURIComponent(domain)}&type=TXT`,
      { method: 'POST', signal: AbortSignal.timeout(DOH_REQUEST_TIMEOUT_MS) },
    )
  } catch {
    // Best effort
  }
}

async function resolveTxt(endpoint: string, domain: string): Promise<string[]> {
  const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=TXT`
  const response = await fetch(url, {
    headers: { 'Accept': 'application/dns-json' },
    signal: AbortSignal.timeout(DOH_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) return []

  const data = await response.json() as {
    Answer?: Array<{ type: number; data: string }>
  }

  if (!data.Answer) return []

  return data.Answer
    .filter(a => a.type === 16) // TXT record type
    .map(a => a.data.replace(/^"|"$/g, ''))
}
