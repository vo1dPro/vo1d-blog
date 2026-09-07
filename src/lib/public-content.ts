import { useCallback, useEffect, useState } from 'react'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100').replace(/\/+$/, '')

export interface PublicMedia {
  url: string
  altText?: string | null
}
export interface PublicSiteProfile {
  displayName: string
  role: string
  heroTitlePrefix: string
  heroDescription: string
  learningNote: string
  footerMessage: string
  avatar: PublicMedia | null
}
export interface PublicBook {
  id: number
  title: string
  author: string
  cover: PublicMedia
  accent: string
  sourceName: string | null
  sourceUrl: string | null
  readingOrder: number
  sortOrder: number
  lastReadAt: string | null
  startedAt: string | null
  finishedAt: string | null
  progress: number
}
export interface PublicPhoto {
  id: number
  title: string
  description: string
  alt: string
  original: PublicMedia
  thumbnail: PublicMedia
}
export interface PublicCategory {
  id: number
  key: string
  label: string
  iconKey: string | null
}
export interface PublicTag {
  id: number
  slug: string
  name: string
}
export interface PublicArticle {
  id: number
  slug: string
  title: string
  summary: string
  category: PublicCategory
  tags: PublicTag[]
  publishedAt: string
  cover: PublicMedia
  readingTimeMinutes: number
}
export interface PublicArticleDetail extends PublicArticle {
  contentHtml: string
  toc: { id: string; text: string; level: number }[]
  seoTitle: string | null
  seoDescription: string | null
}
export interface PublicPage<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
export interface PublicSkill {
  id: number
  name: string
  icon: PublicMedia | null
  darkIcon: PublicMedia | null
}
export interface PublicSocial extends PublicSkill {
  url: string
  iconKey: string
}
export interface PublicGame {
  id: number
  title: string
  platform: string | null
  cover: PublicMedia
  rating: number
  playtimeHours: number
  likeLevel: number
  comment: string | null
  steam: { stale: boolean; incomplete: boolean } | null
}

export class PublicContentError extends Error {
  readonly status: number
  constructor(status: number) {
    super(status === 404 ? '内容不存在或已撤回（404）' : `内容加载失败（${status}）`)
    this.status = status
  }
}

async function readJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}/${path}`, {
    signal,
    credentials: 'omit',
    cache: 'no-store',
  })
  if (!response.ok) throw new PublicContentError(response.status)
  // Public reads require JSON. A 204 is a contract error, never a fake empty list.
  if (response.status === 204) throw new Error('内容响应为空（204）')
  return response.json() as Promise<T>
}

async function readCollection<T>(resource: string, signal: AbortSignal): Promise<T[]> {
  const items: T[] = []
  for (let page = 1; ; page++) {
    const value = await readJson<unknown>(`${resource}?page=${page}&pageSize=50`, signal)
    if (
      !value ||
      typeof value !== 'object' ||
      !('items' in value) ||
      !Array.isArray(value.items) ||
      !('totalPages' in value) ||
      typeof value.totalPages !== 'number' ||
      !Number.isInteger(value.totalPages) ||
      value.totalPages < 0 ||
      value.totalPages > 1000
    ) {
      throw new Error('内容响应格式不正确')
    }
    items.push(...(value.items as T[]))
    if (page >= value.totalPages) return items
  }
}

/** No static content fallback: successful empty responses must remain empty. */
function usePublicRequest<T>(resource: string | null, collection: boolean) {
  const [state, setState] = useState<{
    resource: string | null
    data: T | null
    error: string | null
    status: number | null
  }>({ resource: null, data: null, error: null, status: null })
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    if (resource === null) return
    const controller = new AbortController()
    let pending = false
    const load = async () => {
      if (pending) return
      pending = true
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
        const data = collection
          ? ((await readCollection(resource, signal)) as T)
          : await readJson<T>(resource, signal)
        if (!controller.signal.aborted) setState({ resource, data, error: null, status: null })
      } catch (cause) {
        if (!controller.signal.aborted)
          setState((previous) => ({
            resource,
            data:
              previous.resource === resource &&
              !(cause instanceof PublicContentError && [401, 403, 404].includes(cause.status))
                ? previous.data
                : null,
            error: cause instanceof Error ? cause.message : '内容暂时无法加载',
            status: cause instanceof PublicContentError ? cause.status : null,
          }))
      } finally {
        pending = false
      }
    }
    void load()
    const timer = window.setInterval(() => {
      if (!document.hidden) void load()
    }, 60000)
    const refresh = () => {
      if (!document.hidden) void load()
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [resource, collection, revision])
  return {
    data: state.resource === resource ? state.data : null,
    error: state.resource === resource ? state.error : null,
    status: state.resource === resource ? state.status : null,
    retry,
  }
}

export function usePublicCollection<T>(
  resource:
    'skills' | 'social-links' | 'games' | 'books' | 'photos' | 'categories' | 'tags' | 'articles',
) {
  return usePublicRequest<T[]>(resource, true)
}

export function usePublicResource<T>(path: string | null) {
  return usePublicRequest<T>(path, false)
}
