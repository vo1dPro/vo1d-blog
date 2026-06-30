import { articles } from '@/data/articles'
import type { Article } from '@/types'

const thumbnails = [
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

export function estimateReadTime(article: Article) {
  const textLength = article.content.join('').replace(/<[^>]+>/g, '').length
  return `${Math.max(3, Math.ceil(textLength / 260))} min read`
}

export function getArticleThumbnail(article: Article, index = article.id) {
  return thumbnails[(article.id - 1 + index) % thumbnails.length]
}

export function getArticlePath(article: Article) {
  return `/blog/${article.id}`
}

export function getArticleFromPath(pathname: string) {
  const match = pathname.match(/^\/blog\/(\d+)\/?$/)
  if (!match) return null

  const id = Number(match[1])
  return articles.find((article) => article.id === id) ?? null
}
