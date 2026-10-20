import { useCallback } from 'react'
import { getArticleKey } from '@/lib/blog'
import { getArticle } from '@/services/articles'
import { ApiError } from '@/services/client'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import BlogPostPage from '../BlogPostPage'
import QueryContent from '../QueryContent'
import NotFoundPage from '../NotFoundPage'

function ArticleRequest({ articleKey }: { articleKey: string }) {
  const load = useCallback((signal: AbortSignal) => getArticle(articleKey, signal), [articleKey])
  const query = usePublicQuery(load)
  if (query.status === 'error' && query.error instanceof ApiError && query.error.status === 404) return <NotFoundPage article />
  if (query.status === 'success') return <BlogPostPage article={query.data} />
  return <main className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
    <QueryContent query={query} label="article">{() => null}</QueryContent>
  </main>
}

export default function ArticleRoute({ pathname }: { pathname: string }) {
  const articleKey = getArticleKey(pathname)
  return articleKey === null ? <NotFoundPage article /> : <ArticleRequest articleKey={articleKey} />
}
