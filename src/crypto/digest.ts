// base64url encode/decode + SHA-256 digest

export function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function base64urlDecode(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - str.length % 4) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function sha256(data: ArrayBuffer | Uint8Array | string): Promise<ArrayBuffer> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return crypto.subtle.digest('SHA-256', input as ArrayBuffer)
}

export async function sha256Base64url(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  return base64urlEncode(await sha256(data))
}
