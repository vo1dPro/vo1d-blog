import { ArrowLeft } from 'lucide-react'
import type { PublicArticleDetail } from '@/lib/public-content'
import ContentImage from '../ContentImage'
import './index.css'
import { getArticleThumbnail } from '@/lib/blog'
import { BlogMeta, BlogTag } from '../BlogPrimitives'
import FlickeringGrid from '../FlickeringGrid'
import BlogPostSidebar from '../BlogPostSidebar'
import ReadMoreSection from '../ReadMoreSection'

interface BlogPostPageProps {
  article: PublicArticleDetail
}

export default function BlogPostPage({ article }: BlogPostPageProps) {
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
              <a key={tag.id} href={`/?tag=${encodeURIComponent(tag.slug)}#blog`}>
                <BlogTag>{tag.name}</BlogTag>
              </a>
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
              <ContentImage
                src={getArticleThumbnail(article)}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 lg:p-10">
              <div
                className="article-content mx-auto max-w-3xl"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />
            </div>
          </article>

          <ReadMoreSection currentArticle={article} />
        </main>

        <BlogPostSidebar toc={article.toc} />
      </div>
    </main>
  )
}
