import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { wordBlocks, wordViewBox } from '@/lib/pixel-glyphs'
import './index.css'

function useRevealOnce<T extends Element>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setRevealed(true)
      observer.disconnect()
    }, { threshold: 0.5, rootMargin: '0px 0px -8% 0px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, revealed] as const
}

interface SectionTitleProps {
  /** Two-digit section number, drawn in the wordmark's block letters. */
  index: string
  title: string
  subtitle?: ReactNode
  id?: string
}

export default function SectionTitle({ index, title, subtitle, id }: SectionTitleProps) {
  const [ref, revealed] = useRevealOnce<HTMLElement>()
  const blocks = wordBlocks(index)
  // Once the blocks have popped in they are swapped for one merged path, which cannot show seams.
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (!revealed) return
    const timer = window.setTimeout(() => setSettled(true), blocks.length * 38 + 520)
    return () => window.clearTimeout(timer)
  }, [revealed, blocks.length])

  return (
    <header ref={ref} className="section-title" data-revealed={revealed}>
      <svg className="section-title__index" viewBox={wordViewBox(index)} aria-hidden="true">
        {settled ? <path className="section-title__index-merged" d={blocks.map(block => block.path).join("")} /> : blocks.map((block, order) => (
          <path
            key={`${block.letter}-${block.col}-${block.row}`}
            d={block.path}
            style={{ '--order': order } as CSSProperties}
          />
        ))}
      </svg>
      <h2 id={id} className="section-title__heading" aria-label={title}>
        {[...title].map((character, order) => (
          <span key={order} aria-hidden="true" style={{ '--order': order } as CSSProperties}>{character}</span>
        ))}
      </h2>
      {subtitle && <p className="section-title__meta">{subtitle}</p>}
    </header>
  )
}

interface SectionSubtitleProps {
  label: string
  count?: number
  /** When set, the subtitle becomes a disclosure button for the block below it. */
  expanded?: boolean
  controls?: string
  onToggle?: () => void
}

export function SectionSubtitle({ label, count, expanded, controls, onToggle }: SectionSubtitleProps) {
  const content = <>
    <span className="section-subtitle__marker" aria-hidden="true" />
    <h3>{label}</h3>
    <span className="section-subtitle__rule" aria-hidden="true" />
    {count !== undefined && <span className="section-subtitle__count">{String(count).padStart(2, '0')}</span>}
    {onToggle && <ChevronRight size={14} className="section-subtitle__chevron" aria-hidden="true" />}
  </>

  if (!onToggle) return <div className="section-subtitle">{content}</div>
  return (
    <button type="button" className="section-subtitle" onClick={onToggle} aria-expanded={expanded} aria-controls={controls}>
      {content}
    </button>
  )
}
