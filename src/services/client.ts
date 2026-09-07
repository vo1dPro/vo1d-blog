import type { Page } from './model'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly retryAt: number | null

  constructor(status: number, message: string, retryAfter: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    const seconds = retryAfter === null ? NaN : Number(retryAfter)
    const deadline = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(retryAfter ?? '')
    this.retryAt = Number.isFinite(deadline) ? deadline : null
  }
}

export async function request<T>(path: string, signal: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      // A visitor refresh must observe edits and publication changes immediately.
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new ApiError(0, 'Unable to load content. Check your connection and try again.')
  }
  if (!response.ok) {
    throw new ApiError(response.status, `Unable to load content (${response.status}).`, response.headers.get('Retry-After'))
  }
  if (response.status === 204) throw new ApiError(204, 'The server returned no content (204).')
  try {
    const value: unknown = await response.json()
    if (value === null || typeof value !== 'object') throw new Error('Invalid response')
    return value as T
  } catch {
    throw new ApiError(response.status, 'The server returned an invalid response. Please retry.')
  }
}

export function listPath(path: string, page = 1, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: '50' })
  for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, value)
  return `${path}?${params}`
}

export function assertPage<T>(value: Page<T>): Page<T> {
  if (!Array.isArray(value.items)
    || !Number.isInteger(value.page) || value.page < 1
    || !Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 50
    || !Number.isInteger(value.total) || value.total < 0
    || value.totalPages !== Math.ceil(value.total / value.pageSize)) {
    throw new ApiError(200, 'The server returned invalid pagination. Please retry.')
  }
  return value
}

export async function allPages<T extends { id: number }>(path: string, signal: AbortSignal, filters: Record<string, string> = {}): Promise<T[]> {
  const first = assertPage(await request<Page<T>>(listPath(path, 1, filters), signal))
  if (first.page !== 1) throw new ApiError(200, 'Unexpected page. Please retry.')
  const items = [...first.items]
  for (let page = 2; page <= first.totalPages; page++) {
    signal.throwIfAborted()
    const next = assertPage(await request<Page<T>>(listPath(path, page, filters), signal))
    if (next.page !== page || next.total !== first.total || next.pageSize !== first.pageSize) {
      throw new ApiError(200, 'Content changed while loading. Please retry.')
    }
    items.push(...next.items)
  }
  if (items.length !== first.total || new Set(items.map(item => item.id)).size !== items.length) {
    throw new ApiError(200, 'The content list is incomplete. Please retry.')
  }
  return items
}
