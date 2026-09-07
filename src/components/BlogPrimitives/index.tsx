import { CalendarDays, Clock3 } from 'lucide-react'
import type { PublicArticle } from '@/lib/public-content'
import { estimateReadTime, formatArticleDate } from '@/lib/blog'

interface BlogTagProps {
  children: string
  active?: boolean
}

export function BlogTag({ children, active = false }: BlogTagProps) {
  return (
    <span
      className={`rounded-md border px-3 py-1 text-sm font-medium ${
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-muted text-muted-foreground'
      }`}
    >
      {children}
    </span>
  )
}

interface BlogMetaProps {
  article: PublicArticle
  compact?: boolean
}

export function BlogMeta({ article, compact = false }: BlogMetaProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
      <span className="inline-flex items-center gap-1">
        <CalendarDays size={compact ? 14 : 15} />
        <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
      </span>
      <span>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 size={compact ? 14 : 15} />
        {estimateReadTime(article)}
      </span>
    </div>
  )
}
