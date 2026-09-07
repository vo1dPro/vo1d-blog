import { UserRound } from 'lucide-react'

import { useSiteProfile } from '@/lib/site-profile'
import type { PublicArticleDetail } from '@/lib/public-content'
import ContentImage from '../ContentImage'

export default function BlogPostSidebar({ toc }: Pick<PublicArticleDetail, 'toc'>) {
  const profile = useSiteProfile()
  return (
    <aside className="hidden w-[350px] shrink-0 bg-muted/60 p-6 dark:bg-muted/20 lg:block lg:p-10">
      <div className="sticky top-24 space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            {profile?.avatar ? (
              <ContentImage
                src={profile.avatar.url}
                alt={profile.displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserRound size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{profile?.displayName}</p>
            <p className="text-xs text-muted-foreground">{profile?.role}</p>
          </div>
        </div>

        <nav aria-label="文章目录" className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">On this page</p>
          <div className="space-y-3">
            {toc.length === 0 && <p className="text-sm text-muted-foreground">暂无章节目录</p>}
            {toc.map((item) => (
              <a
                key={item.id}
                href={'#' + item.id}
                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.text}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}
