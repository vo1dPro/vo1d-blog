import { useMemo, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { articles } from '@/data/articles'
import {
  getArticlePath,
  getArticleThumbnail,
} from '@/lib/blog'
import { BlogMeta } from '../BlogPrimitives'
import FlickeringGrid from '../FlickeringGrid'

export default function BlogSection() {
  const [selectedTag, setSelectedTag] = useState('All')

  const sortedArticles = useMemo(
    () => [...articles].sort((left, right) => right.date.localeCompare(left.date)),
    [],
  )

  const tags = useMemo(
    () => [
      'All',
      ...Array.from(new Set(sortedArticles.flatMap((article) => article.tags))).sort(),
    ],
    [sortedArticles],
  )

  const tagCounts = useMemo(() => {
    return tags.reduce<Record<string, number>>((counts, tag) => {
      counts[tag] = tag === 'All'
        ? sortedArticles.length
        : sortedArticles.filter((article) => article.tags.includes(tag)).length
      return counts
    }, {})
  }, [sortedArticles, tags])

  const filteredArticles = useMemo(() => {
    if (selectedTag === 'All') return sortedArticles
    return sortedArticles.filter((article) => article.tags.includes(selectedTag))
  }, [selectedTag, sortedArticles])

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

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = selectedTag === tag

              return (
                <button
                  key={tag}
                  className={`flex h-8 items-center rounded-lg border px-1 pl-3 text-sm transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-card/80 text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTag(tag)}
                >
                  <span>{tag}</span>
                  <span
                    className={`ml-2 flex h-6 min-w-6 items-center justify-center rounded-md border px-1 text-xs font-medium ${
                      isActive
                        ? 'border-white/35 bg-background text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {tagCounts[tag]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-0">
        <div className="grid grid-cols-1 overflow-hidden border-x border-border md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, index) => (
            <a
              key={article.id}
              href={getArticlePath(article)}
              className="group relative block border-b border-r border-border bg-card text-left transition-colors hover:bg-muted/45"
            >
              <div className="flex min-h-full flex-col">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  <img
                    src={getArticleThumbnail(article, index)}
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
                        key={tag}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
