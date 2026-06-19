import type { Logger } from './logger.ts'

export interface HttpOptions {
  timeoutMs?: number
  logger?: Logger
}

export async function httpFetch(
  url: string,
  init: RequestInit & HttpOptions = {},
): Promise<Response> {
  const { timeoutMs = 30000, logger, ...fetchInit } = init
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    logger?.debug(`fetch ${fetchInit.method ?? 'GET'} ${url}`)
    const response = await fetch(url, { ...fetchInit, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}

export async function httpFetchJson<T>(
  url: string,
  init?: RequestInit & HttpOptions,
): Promise<T> {
  const response = await httpFetch(url, init)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`)
  }
  return response.json() as Promise<T>
}
