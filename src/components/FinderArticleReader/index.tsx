import { useEffect, useRef, useState, startTransition } from 'react'
import type { Article } from '@/types'
import { Calendar, Tag } from 'lucide-react'

interface FinderArticleReaderProps {
  article: Article | null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr || 'Unknown date'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function FinderArticleReader({ article }: FinderArticleReaderProps) {
  const [displayed, setDisplayed] = useState<Article | null>(null)
  const [visible, setVisible] = useState(false)
  const isLeaving = useRef(false)
  const prevArticle = useRef<Article | null>(null)

  useEffect(() => {
    if (article && article !== prevArticle.current) {
      // Opening or switching: store article, then animate in
      isLeaving.current = false
      startTransition(() => setDisplayed(article))
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
    } else if (!article && displayed && !isLeaving.current) {
      // Closing: animate out (displayed stays until transitionEnd clears it)
      isLeaving.current = true
      setVisible(false)
    }
    prevArticle.current = article
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article])

  function handleTransitionEnd(e: React.TransitionEvent) {
    if (e.target === e.currentTarget && isLeaving.current) {
      isLeaving.current = false
      startTransition(() => setDisplayed(null))
    }
  }

  if (!displayed) return null

  return (
    <div
      className={`absolute inset-0 z-10 bg-white flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
      onTransitionEnd={handleTransitionEnd}
      style={{ transitionDuration: visible ? '300ms' : '200ms' }}
    >
      {/* Article body */}
      <div className="flex-1 overflow-auto">
        <article className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] leading-tight mb-4">
            {displayed.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar size={14} />
              {formatDate(displayed.date)}
            </span>
            {displayed.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F5F7] text-muted-foreground text-xs rounded-md"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>

          <div className="space-y-5">
            {displayed.content.map((paragraph, index) => (
              <p
                key={index}
                className="text-[#1D1D1F] leading-relaxed text-[15px]"
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-gray-100 text-center text-sm text-muted-foreground">
            — End of Article —
          </div>
        </article>
      </div>
    </div>
  )
}
