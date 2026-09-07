import { allPages, assertPage, request } from '../client'
import type { Page } from '../model'
import type { Article, ArticleDetail, ArticleDetailResponse, ArticleResponse } from './model'
import { getCategories } from '../categories'
import { getTags } from '../tags'

function mapArticle(article: ArticleResponse): Article {
  return {
    ...article, category: article.category.label, categoryKey: article.category.key,
    categoryInfo: article.category, tags: article.tags.map(tag => tag.name), tagDetails: article.tags,
    date: article.publishedAt, cover: article.cover.url,
  }
}

export async function getArticles(signal: AbortSignal, filters: Record<string, string> = {}): Promise<Article[]> {
  return (await allPages<ArticleResponse>('/articles', signal, filters)).map(mapArticle)
}

export async function getArticleCatalog(signal: AbortSignal) {
  const [articles, categories, tags] = await Promise.all([getArticles(signal), getCategories(signal), getTags(signal)])
  return { articles, categories, tags }
}

export async function getArticle(slugOrId: string, signal: AbortSignal): Promise<ArticleDetail> {
  const article = await request<ArticleDetailResponse>(`/articles/${encodeURIComponent(slugOrId)}`, signal)
  if (typeof article.contentHtml !== 'string' || !Array.isArray(article.toc)) throw new Error('Invalid article response. Please retry.')
  return { ...mapArticle(article), contentHtml: article.contentHtml, toc: article.toc, seoTitle: article.seoTitle, seoDescription: article.seoDescription }
}

export async function getRelatedArticles(slugOrId: string, signal: AbortSignal): Promise<Article[]> {
  // This endpoint is a limited recommendation list; it does not accept page.
  const page = assertPage(await request<Page<ArticleResponse>>(`/articles/${encodeURIComponent(slugOrId)}/related?limit=3`, signal))
  return page.items.map(mapArticle)
}
