export function split2(fulldomain: string): { domain: string; sub: string } {
  const parts = fulldomain.split('.')
  if (parts.length <= 2) return { domain: fulldomain, sub: '@' }
  return { domain: parts.slice(-2).join('.'), sub: parts.slice(0, -2).join('.') || '@' }
}
