import { ArrowUpRight } from 'lucide-react'
import { useCallback } from 'react'
import { getRelatedArticles } from '@/services/articles'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import QueryContent from '../QueryContent'
import type { Article } from '@/types'
import {
  formatArticleDate,
  getArticlePath,
  getArticleThumbnail,
} from '@/lib/blog'

interface ReadMoreSectionProps {
  currentArticle: Article
}

export default function ReadMoreSection({ currentArticle }: ReadMoreSectionProps) {
  const load = useCallback((signal: AbortSignal) => getRelatedArticles(String(currentArticle.id), signal), [currentArticle.id])
  const query = usePublicQuery(load)
  if (query.status === 'success' && query.data.length === 0) return null

  return (
    <section className="border-t border-border p-6 lg:p-10">
      <h2 className="mb-8 text-2xl font-semibold text-foreground">Read more</h2>
      <QueryContent query={query} label="related articles">{recommended =>
      <div className="space-y-8">
        {recommended.map((article) => (
          <a
            key={article.id}
            href={getArticlePath(article)}
            className="group grid gap-4 sm:grid-cols-[272px_minmax(0,1fr)] sm:items-center"
          >
            <div className="h-36 overflow-hidden rounded-lg bg-muted">
              <img
                src={getArticleThumbnail(article)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <h3 className="flex-1 text-lg font-semibold leading-7 text-foreground group-hover:underline group-hover:underline-offset-4">
                  {article.title}
                </h3>
                <ArrowUpRight
                  size={18}
                  className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {article.summary}
              </p>
              <time className="mt-2 block text-sm font-medium text-muted-foreground">
                {formatArticleDate(article.date)}
              </time>
            </div>
          </a>
        ))}
      </div>
      }</QueryContent>
    </section>
  )
}
