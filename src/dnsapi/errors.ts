// DNS provider error — thrown by dnsapi providers.
// Moved out of acme/errors.ts so the dnsapi layer does not depend on the acme layer.

export class DnsProviderError extends Error {
  public readonly providerId: string

  constructor(message: string, providerId: string) {
    super(`[${providerId}] ${message}`)
    this.name = 'DnsProviderError'
    this.providerId = providerId
  }
}
