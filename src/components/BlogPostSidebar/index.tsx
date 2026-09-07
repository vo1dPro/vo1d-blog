import { UserRound } from 'lucide-react'
import type { TocItem } from '@/services/articles/model'
import { useSiteContent } from '@/hooks/site-content-context'
import QueryContent from '../QueryContent'

export default function BlogPostSidebar({ toc }: { toc: TocItem[] }) {
  const { profile } = useSiteContent()
  return (
    <aside className="hidden w-[350px] shrink-0 bg-muted/60 p-6 dark:bg-muted/20 lg:block lg:p-10">
      <div className="sticky top-24 space-y-8">
        <QueryContent query={profile} label="author">{data => <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            {data.avatar ? <img src={data.avatar.url} alt={data.displayName} className="h-full w-full rounded-full object-cover" /> : <UserRound size={20} className="text-muted-foreground" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{data.displayName}</p>
            <p className="text-xs text-muted-foreground">{data.role}</p>
          </div>
        </div>}</QueryContent>

        {toc.length > 0 && <nav aria-label="On this page" className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">On this page</p>
          <div className="space-y-3">
            {toc.map((item) => (
              <a
                key={item.id}
                href={`#${encodeURIComponent(item.id)}`}
                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.text}
              </a>
            ))}
          </div>
        </nav>}
      </div>
    </aside>
  )
}
