import { useCallback } from 'react'
import { getArticleKey } from '@/lib/blog'
import { getArticle } from '@/services/articles'
import { ApiError } from '@/services/client'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import BlogPostPage from '../BlogPostPage'
import QueryContent from '../QueryContent'

function NotFound() {
  return <main className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
    <div>
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">Article not found</h1>
      <a href="/#blog" className="mt-6 inline-flex rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary">Back to blog</a>
    </div>
  </main>
}

function ArticleRequest({ articleKey }: { articleKey: string }) {
  const load = useCallback((signal: AbortSignal) => getArticle(articleKey, signal), [articleKey])
  const query = usePublicQuery(load)
  if (query.status === 'error' && query.error instanceof ApiError && query.error.status === 404) return <NotFound />
  if (query.status === 'success') return <BlogPostPage article={query.data} />
  return <main className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
    <QueryContent query={query} label="article">{() => null}</QueryContent>
  </main>
}

export default function ArticleRoute({ pathname }: { pathname: string }) {
  const articleKey = getArticleKey(pathname)
  return articleKey === null ? <NotFound /> : <ArticleRequest articleKey={articleKey} />
}
