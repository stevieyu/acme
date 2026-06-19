// DoH cache purge for common public resolvers

const PURGE_ENDPOINTS: Record<string, string> = {
  cloudflare: 'https://cloudflare-dns.com/dns-query',
  google: 'https://dns.google/resolve',
}

export async function purgeDohCache(domain: string): Promise<void> {
  // ponytail: most DoH resolvers don't have explicit purge APIs.
  // We simply wait for TTL expiry. For Cloudflare, we can use their purge API.
  // This is a best-effort no-op for most resolvers.
  try {
    await fetch(`https://purge.cloudflare-dns.com/?domain=${encodeURIComponent(domain)}&type=TXT`, {
      method: 'POST',
    })
  } catch {
    // Best effort
  }
}
