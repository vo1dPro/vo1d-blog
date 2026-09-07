import type { PublicArticle } from './public-content'

// Historical explicit import source only. Public pages always use cover.url.
export const thumbnails = [
  '/images/blog/react-components-libraries.jpg',
  '/images/blog/react-portfolio-templates.jpg',
  '/images/blog/react-landing-page-templates.jpg',
  '/images/blog/react-animation-libraries.jpg',
  '/images/blog/nextjs-portfolio-templates.jpg',
  '/images/blog/react-native-libraries.jpg',
]

export function formatArticleDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function estimateReadTime(article: PublicArticle) {
  return `${article.readingTimeMinutes} min read`
}

export function getArticleThumbnail(article: PublicArticle) {
  return article.cover.url
}

export function getArticlePath(article: Pick<PublicArticle, 'id'>) {
  return `/blog/${article.id}`
}

export function getArticleFromPath(pathname: string) {
  const match = pathname.match(/^\/blog\/([^/]+)\/?$/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}
