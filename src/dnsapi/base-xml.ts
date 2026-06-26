import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import type { DnsProvider, DnsProviderContext, TxtRecordInput } from './types.ts'
import { DnsProviderError } from './errors.ts'
export abstract class XmlProviderBase implements DnsProvider {
  abstract readonly id: string
  abstract readonly name: string
  protected readonly baseUrl: string
  protected readonly parser: XMLParser
  protected readonly builder: XMLBuilder
  protected ctx!: DnsProviderContext

  protected constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
    })
    this.builder = new XMLBuilder({
      attributeNamePrefix: '@_',
      ignoreAttributes: false,
      format: true,
    })
  }

  setContext(ctx: DnsProviderContext): void {
    this.ctx = ctx
  }

  protected abstract buildXmlBody(
    method: string,
    params: Record<string, unknown>,
  ): string

  protected abstract parseXmlResponse(xml: string): unknown

  protected async xmlRequest<T>(
    method: string,
    params: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const body = this.buildXmlBody(method, params)

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        ...headers,
      },
      body,
    })

    const text = await response.text()

    if (!response.ok) {
      throw new DnsProviderError(
        `HTTP ${response.status}: ${text.substring(0, 200)}`,
        this.id,
      )
    }

    return this.parseXmlResponse(text) as T
  }

  abstract createTxtRecord(record: TxtRecordInput): Promise<void>
  abstract deleteTxtRecord(record: TxtRecordInput): Promise<void>
}
