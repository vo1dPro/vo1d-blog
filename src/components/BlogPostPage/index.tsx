import { ArrowLeft } from 'lucide-react'
import type { Article } from '@/types'
import {
  getArticleThumbnail,
} from '@/lib/blog'
import { BlogMeta, BlogTag } from '../BlogPrimitives'
import FlickeringGrid from '../FlickeringGrid'
import BlogPostSidebar from '../BlogPostSidebar'
import ReadMoreSection from '../ReadMoreSection'

interface BlogPostPageProps {
  article: Article
}

export default function BlogPostPage({ article }: BlogPostPageProps) {
  const intro = article.content[0]
  const body = article.content.slice(1, -1)
  const conclusion = article.content.at(-1)

  return (
    <main className="relative z-10 min-h-screen bg-background pt-20">
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

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
          <a
            href="/#blog"
            className="mb-8 inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            All posts
          </a>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {article.tags.map((tag) => (
              <BlogTag key={tag}>{tag}</BlogTag>
            ))}
            <BlogMeta article={article} />
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-4xl text-base leading-8 text-muted-foreground md:text-lg">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl border-x border-border bg-background">
        <main className="min-w-0 flex-1 overflow-hidden">
          <article>
            <div className="h-[360px] overflow-hidden border-b border-border md:h-[500px]">
              <img
                src={getArticleThumbnail(article)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 lg:p-10">
              <div className="mx-auto max-w-3xl">
                <section id="overview" className="scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Overview
                  </h2>
                  <p
                    className="mt-4 text-base leading-8 text-foreground/85"
                    dangerouslySetInnerHTML={{ __html: intro }}
                  />
                </section>

                <section id="key-notes" className="mt-10 scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Key Notes
                  </h2>
                  <div className="mt-4 rounded-lg border border-border bg-muted/40 p-5">
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {article.tags.map((tag) => (
                        <li key={tag}>Use this post as a reference for {tag} decisions and tradeoffs.</li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section id="details" className="mt-10 scroll-mt-24">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Details
                  </h2>
                  <div className="mt-4 space-y-6">
                    {body.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-base leading-8 text-foreground/85"
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
                    ))}
                  </div>
                </section>

                {conclusion && (
                  <section id="conclusion" className="mt-10 scroll-mt-24">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      Conclusion
                    </h2>
                    <p
                      className="mt-4 text-base leading-8 text-foreground/85"
                      dangerouslySetInnerHTML={{ __html: conclusion }}
                    />
                  </section>
                )}
              </div>
            </div>
          </article>

          <ReadMoreSection currentArticle={article} />
        </main>

        <BlogPostSidebar />
      </div>
    </main>
  )
}
