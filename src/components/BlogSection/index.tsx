import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import {
  usePublicCollection,
  usePublicResource,
  type PublicArticle,
  type PublicCategory,
  type PublicTag,
  type PublicPage,
} from '@/lib/public-content'
import { ContentStatus } from '../ContentStatus'
import ContentImage from '../ContentImage'
import { getArticlePath, getArticleThumbnail } from '@/lib/blog'
import { BlogMeta } from '../BlogPrimitives'
import FlickeringGrid from '../FlickeringGrid'

function readFilters() {
  const query = new URLSearchParams(window.location.search)
  const page = Number(query.get('page') ?? 1)
  return {
    tag: query.get('tag') ?? '',
    category: query.get('category') ?? 'all',
    page: Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1,
  }
}

export default function BlogSection() {
  const [filters, setFilters] = useState(readFilters)
  const categories = usePublicCollection<PublicCategory>('categories')
  const tags = usePublicCollection<PublicTag>('tags')
  // Tag counts use every public summary, not only the current six-item page.
  const summaries = usePublicCollection<PublicArticle>('articles')
  const countedArticles = summaries.data?.filter(
    (article) => filters.category === 'all' || article.category.key === filters.category,
  )
  const params = new URLSearchParams({
    page: String(filters.page),
    pageSize: '6',
    category: filters.category,
  })
  if (filters.tag) params.set('tag', filters.tag)
  const content = usePublicResource<PublicPage<PublicArticle>>(`articles?${params}`)
  const filteredArticles = content.data?.items ?? []

  useEffect(() => {
    const update = () => setFilters(readFilters())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  function select(next: typeof filters) {
    setFilters(next)
    const url = new URL(window.location.href)
    for (const key of ['tag', 'category', 'page'] as const) {
      const value = String(next[key])
      if (
        value === '' ||
        (key === 'category' && value === 'all') ||
        (key === 'page' && value === '1')
      )
        url.searchParams.delete(key)
      else url.searchParams.set(key, value)
    }
    url.hash = 'blog'
    window.history.pushState(null, '', url)
  }

  return (
    <section id="blog" className="relative py-24">
      <div className="relative overflow-hidden border-y border-border bg-background">
        <div className="absolute left-0 top-0 z-0 h-[220px] w-full [mask-image:linear-gradient(to_top,transparent_10%,black_95%)]">
          <FlickeringGrid
            className="absolute left-0 top-0 size-full"
            squareSize={4}
            gridGap={6}
            color="#6b7280"
            maxOpacity={0.2}
            flickerChance={0.05}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[250px] max-w-7xl flex-col justify-center gap-6 px-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
              Blog
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Notes, experiments, and development updates collected in a clean Magic UI blog layout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pb-4">
            <label className="text-sm text-muted-foreground">
              分类
              <select
                aria-label="文章分类"
                className="ml-2 rounded-lg border border-border bg-card px-3 py-1 text-foreground"
                value={filters.category}
                onChange={(event) => select({ ...filters, category: event.target.value, page: 1 })}
              >
                <option value="all">
                  {categories.data?.find((category) => category.key === 'all')?.label ??
                    'All Articles'}
                </option>
                {(categories.data ?? [])
                  .filter((category) => category.key !== 'all')
                  .map((category) => (
                    <option key={category.id} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                {filters.category !== 'all' &&
                  categories.data &&
                  !categories.data.some((category) => category.key === filters.category) && (
                    <option value={filters.category}>分类已不可用</option>
                  )}
              </select>
            </label>
            <ContentStatus
              error={categories.error}
              loading={categories.data === null}
              empty={false}
              retry={categories.retry}
            />
            <ContentStatus
              error={tags.error}
              loading={tags.data === null}
              empty={false}
              retry={tags.retry}
            />
            <ContentStatus
              error={content.data && !content.error ? summaries.error : null}
              loading={false}
              empty={false}
              retry={summaries.retry}
            />
            <div className="flex flex-wrap gap-2" aria-label="文章标签">
              {[{ id: 0, slug: '', name: 'All' }, ...(tags.data ?? [])].map((tag) => (
                <button
                  key={tag.id}
                  aria-pressed={filters.tag === tag.slug}
                  className={`flex h-8 items-center rounded-lg border px-3 text-sm transition-colors ${filters.tag === tag.slug ? 'border-primary bg-primary text-white' : 'border-border bg-card/80 text-foreground hover:bg-muted'}`}
                  onClick={() => select({ ...filters, tag: tag.slug, page: 1 })}
                >
                  {tag.name}
                  <span className="ml-2 rounded-md border border-border bg-background px-1.5 text-xs text-muted-foreground">
                    {countedArticles
                      ? tag.slug
                        ? countedArticles.filter((article) =>
                            article.tags.some((item) => item.slug === tag.slug),
                          ).length
                        : countedArticles.length
                      : summaries.error ? '—' : '…'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-0">
        <ContentStatus
          error={content.error}
          loading={content.data === null}
          empty={content.data?.items.length === 0}
          retry={() => { content.retry(); summaries.retry() }}
        />
        <div className="grid grid-cols-1 overflow-hidden border-x border-border md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <a
              key={article.id}
              href={getArticlePath(article)}
              className="group relative block border-b border-r border-border bg-card text-left transition-colors hover:bg-muted/45"
            >
              <div className="flex min-h-full flex-col">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <ContentImage
                    src={getArticleThumbnail(article)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2 p-6">
                  <BlogMeta article={article} compact />

                  <div className="flex items-start gap-3">
                    <h3 className="flex-1 text-xl font-semibold leading-tight text-card-foreground group-hover:underline group-hover:underline-offset-4">
                      {article.title}
                    </h3>
                    <ArrowUpRight
                      size={18}
                      className="mt-1 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {article.summary}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {article.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
        <nav
          aria-label="文章分页"
          className="flex items-center justify-center gap-4 py-6 text-sm text-muted-foreground"
        >
          <button
            disabled={filters.page <= 1}
            className="disabled:opacity-40"
            onClick={() => select({ ...filters, page: filters.page - 1 })}
          >
            上一页
          </button>
          <span>
            {content.data
              ? `第 ${filters.page} / ${Math.max(1, content.data.totalPages)} 页 · ${content.data.total} 篇`
              : '正在加载页数…'}
          </span>
          <button
            disabled={!content.data || filters.page >= content.data.totalPages}
            className="disabled:opacity-40"
            onClick={() => select({ ...filters, page: filters.page + 1 })}
          >
            下一页
          </button>
          {filters.page > 1 && content.data?.items.length === 0 && (
            <button onClick={() => select({ ...filters, page: 1 })}>返回第一页</button>
          )}
        </nav>
      </div>
    </section>
  )
}
