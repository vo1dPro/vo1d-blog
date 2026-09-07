import type { Article } from '@/services/articles/model'

export function formatArticleDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function estimateReadTime(article: Article) { return article.readingTimeMinutes + ' min read' }
export function getArticleThumbnail(article: Article) { return article.cover }
export function getArticlePath(article: Article) { return '/blog/' + article.id }

export function getArticleKey(pathname: string): string | null {
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/)
  if (!match) return null
  try { return decodeURIComponent(match[1]) } catch { return null }
}
