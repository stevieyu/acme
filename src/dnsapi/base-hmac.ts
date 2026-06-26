import type { DnsProvider, DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
import { _url_replace } from '../crypto/digest.ts'

export abstract class HmacProviderBase implements DnsProvider {
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

  protected async hmacSign(
    key: ArrayBuffer | Uint8Array,
    data: string,
    algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256',
  ): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key as ArrayBuffer,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
    return _url_replace(signature)
  }

  protected async hmacSignBase64(
    key: ArrayBuffer | Uint8Array,
    data: string,
    algorithm: 'SHA-256' | 'SHA-1' = 'SHA-256',
  ): Promise<string> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key as ArrayBuffer,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
    const bytes = new Uint8Array(signature)
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary)
  }

  protected abstract buildSignedHeaders(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<Record<string, string>>

  protected async request<T>(
    method: string,
    url: string,
    body?: unknown,
  ): Promise<{ data: T; status: number }> {
    const headers = await this.buildSignedHeaders(method, url, body)
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'

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

  abstract createTxtRecord(record: TxtRecordInput): Promise<void>
  abstract deleteTxtRecord(record: TxtRecordInput): Promise<void>
}
