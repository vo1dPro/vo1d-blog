import type { Media } from '../model'
import type { Tag } from '../tags/model'

export interface ArticleResponse {
  id: number
  slug: string
  title: string
  summary: string
  category: { id: number; key: string; label: string; iconKey: string | null }
  tags: Tag[]
  publishedAt: string
  cover: Media
  readingTimeMinutes: number
}

export interface TocItem { id: string; text: string; level: number }

export interface ArticleDetailResponse extends ArticleResponse {
  contentHtml: string
  toc: TocItem[]
  seoTitle: string | null
  seoDescription: string | null
}

export interface Article extends Omit<ArticleResponse, 'category' | 'tags' | 'cover'> {
  category: string
  categoryKey: string
  categoryInfo: ArticleResponse['category']
  tags: string[]
  tagDetails: Tag[]
  date: string
  cover: string
}

export interface ArticleDetail extends Article {
  contentHtml: string
  toc: TocItem[]
  seoTitle: string | null
  seoDescription: string | null
}
