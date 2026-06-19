// DNS-over-HTTPS propagation checker

const DOH_ENDPOINTS = [
  'https://dns.google/resolve',
  'https://cloudflare-dns.com/dns-query',
]

export async function checkDnsPropagation(
  domain: string,
  expectedValue: string,
  options: { timeoutMs?: number; intervalMs?: number; maxAttempts?: number } = {},
): Promise<boolean> {
  const { intervalMs = 5000, maxAttempts = 60 } = options

  for (let i = 0; i < maxAttempts; i++) {
    const propagated = await queryDoh(domain, expectedValue)
    if (propagated) return true
    await new Promise(r => setTimeout(r, intervalMs))
  }

  return false
}

export async function queryDoh(domain: string, expectedValue: string): Promise<boolean> {
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const values = await resolveTxt(endpoint, domain)
      if (values.includes(expectedValue)) return true
    } catch {
      // Try next endpoint
    }
  }
  return false
}

async function resolveTxt(endpoint: string, domain: string): Promise<string[]> {
  const url = `${endpoint}?name=${encodeURIComponent(domain)}&type=TXT`
  const response = await fetch(url, {
    headers: { 'Accept': 'application/dns-json' },
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
