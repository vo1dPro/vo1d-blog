import { parseCreationFeed, parseLayout } from './parse'
import { request } from '../client'

// Optional explicit preview feed; failed live requests never
// silently fall back to public preview posts.
const feedUrl = import.meta.env.VITE_CREATION_FEED_URL

export async function getCreations(signal: AbortSignal) {
  if (!feedUrl) {
    type Page = { totalPages: number; total: number; page: number }
    const first = await request<Page>('/creations?page=1&pageSize=50', signal)
    if (!Number.isInteger(first.totalPages) || first.totalPages < 0 || first.page !== 1) throw new Error('动态分页格式不正确。')
    const feed = parseCreationFeed(first)
    for (let page = 2; page <= first.totalPages; page++) {
      const next = await request<Page>(`/creations?page=${page}&pageSize=50`, signal)
      if (next.total !== first.total || next.page !== page) throw new Error('动态内容发生变化，请重新加载。')
      feed.items.push(...parseCreationFeed(next).items)
    }
    if (feed.items.length !== first.total || new Set(feed.items.map(item => `${item.platform}:${item.id}`)).size !== feed.items.length) throw new Error('动态列表不完整，请重新加载。')
    feed.layout = parseLayout(await request<unknown>('/creations/layout', signal))
    return feed
  }
  const response = await fetch(feedUrl, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    headers: { Accept: 'application/json' },
    credentials: 'omit',
    cache: 'no-cache',
  })
  if (!response.ok) throw new Error('暂时无法加载动态，请稍后重试。')
  const value: unknown = await response.json()
  return parseCreationFeed(value)
}
