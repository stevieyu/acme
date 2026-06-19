import type { DnsProviderContext } from '../src/providers/types.ts'

export interface MockRoute {
  [key: string]: unknown
}

export interface MockFetchCall {
  url: string
  method: string
  headers: Record<string, string>
  body: string | undefined
}

export function mockFetch(routes: MockRoute): {
  fetch: (url: string | URL | Request, init?: RequestInit) => Promise<Response>
  calls: MockFetchCall[]
} {
  const calls: MockFetchCall[] = []

  const mockFn = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url
    const method = init?.method ?? 'GET'
    const key = `${method} ${urlStr}`

    calls.push({
      url: urlStr,
      method,
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body as string | undefined,
    })

    // Find matching route - try exact match first, then prefix/partial match
    for (const [pattern, response] of Object.entries(routes)) {
      if (key === pattern || key.startsWith(pattern) || key.includes(pattern)) {
        const responseBody = typeof response === 'string' ? response : JSON.stringify(response)
        return new Response(responseBody, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Replay-Nonce': 'test-nonce-' + Date.now() },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
  }

  return { fetch: mockFn as typeof globalThis.fetch, calls }
}

export function ctx(): DnsProviderContext {
  return {
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    },
  }
}

export function installMockFetch(mock: { fetch: typeof globalThis.fetch }): () => void {
  const original = globalThis.fetch
  globalThis.fetch = mock.fetch
  return () => { globalThis.fetch = original }
}
