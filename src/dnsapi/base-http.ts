import type { DnsProvider, DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from '../acme/errors.ts'

export interface HttpProviderEndpoints {
  baseUrl: string
  listZones?: string
  listRecords?: string
  createRecord?: string
  deleteRecord?: string
}

export abstract class HttpProviderBase implements DnsProvider {
  abstract readonly id: string
  abstract readonly name: string
  protected readonly baseUrl: string
  protected ctx!: DnsProviderContext

  protected constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setContext(ctx: DnsProviderContext): void {
    this.ctx = ctx
  }

  protected abstract buildAuthHeaders(): Record<string, string>

  protected async request<T>(
    method: string,
    url: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const headers: Record<string, string> = {
      ...this.buildAuthHeaders(),
      ...extraHeaders,
    }

    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await response.text()
    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      data = text as unknown as T
    }

    if (!response.ok) {
      throw new DnsProviderError(
        `HTTP ${response.status}: ${typeof data === 'object' ? JSON.stringify(data) : text}`,
        this.id,
      )
    }

    return { data, status: response.status }
  }

  // ponytail: generic zone discovery by walking up domain parts
  protected async findZone(domain: string, listZonesUrl: string): Promise<string> {
    const parts = domain.split('.')
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.')
      try {
        const { data } = await this.request<{ id?: string; name?: string }[]>(
          'GET',
          `${listZonesUrl}?name=${encodeURIComponent(candidate)}`,
        )
        if (Array.isArray(data) && data.length > 0) {
          return data[0]!.id ?? data[0]!.name ?? candidate
        }
      } catch {
        // Try next level
      }
    }
    throw new DnsProviderError(`Could not find zone for ${domain}`, this.id)
  }

  abstract createTxtRecord(record: TxtRecordInput): Promise<void>
  abstract deleteTxtRecord(record: TxtRecordInput): Promise<void>
}
