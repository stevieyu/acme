// base64url encode/decode + SHA-256 digest

// acme.sh: _url_replace / _base64 — base64url encoding (base64 + URL-safe chars)
export function _url_replace(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// acme.sh: _durl_replace_base64 — base64url decoding
export function _durl_replace_base64(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - str.length % 4) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// acme.sh: _digest — SHA-256 digest
export async function _digest(data: ArrayBuffer | Uint8Array | string): Promise<ArrayBuffer> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return crypto.subtle.digest('SHA-256', input as ArrayBuffer)
}

// acme.sh L5136: txt="$(printf "%s" "$keyauthorization" | _digest "sha256" | _url_replace)"
export async function _digestUrlReplace(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  return _url_replace(await _digest(data))
}
