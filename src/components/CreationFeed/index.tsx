import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { getCreations } from '@/services/creations'
import type { Creation } from '@/services/creations/model'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import { CreationContent, CreationActions } from './Card'
import CreationDialog from './Dialog'
import './index.css'

function Masonry({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const grid = ref.current
    if (!grid) return
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        for (const child of grid.children) {
          const card = child as HTMLElement
          const span = `span ${Math.ceil(card.getBoundingClientRect().height + 16)}`
          if (card.style.gridRowEnd !== span) card.style.gridRowEnd = span
        }
      })
    })
    for (const child of grid.children) observer.observe(child)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [children])
  return <div ref={ref} className="creation-grid creation-masonry">{children}</div>
}

function cardSize(post: Creation) {
  if (post.article) return 'wide'
  const media = post.media[0]
  if (media?.width && media.height && media.height > media.width * 1.3) return 'portrait'
  if (media || post.body.reduce((length, part) => length + part.text.length, 0) > 160) return 'medium'
  return 'compact'
}

const PREVIEW_HEIGHT = 800

function FeedWindow({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null)
  const moreButton = useRef<HTMLButtonElement>(null)
  const [limit, setLimit] = useState(PREVIEW_HEIGHT)
  const [clipped, setClipped] = useState(false)
  useLayoutEffect(() => {
    const element = viewport.current
    const grid = element?.firstElementChild
    if (!element || !grid) return
    const measure = () => {
      const overflowing = grid.getBoundingClientRect().height > limit + 1
      setClipped(overflowing)
      const boundary = grid.getBoundingClientRect().top + limit - 100
      for (const child of grid.children) {
        if (!(child instanceof HTMLElement)) continue
        const hidden = overflowing && child.getBoundingClientRect().top >= boundary
        if (hidden && child.contains(document.activeElement)) moreButton.current?.focus({ preventScroll: true })
        child.inert = hidden
        for (const control of child.querySelectorAll<HTMLElement>('button,a[href],input,video[controls],[tabindex]')) {
          const clippedControl = overflowing && control.getBoundingClientRect().bottom > boundary
          if (clippedControl && control === document.activeElement) moreButton.current?.focus({ preventScroll: true })
          control.inert = clippedControl
        }
      }
    }
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    for (const child of grid.children) observer.observe(child)
    measure()
    return () => {
      observer.disconnect()
      for (const child of grid.children) if (child instanceof HTMLElement) child.inert = false
      for (const control of grid.querySelectorAll<HTMLElement>('[inert]')) control.inert = false
    }
  }, [children, limit])
  return <div className="creation-feed-window">
    <div id="creation-feed-preview" ref={viewport} className={`creation-feed-viewport ${clipped ? 'is-clipped' : ''}`} style={{ maxHeight: limit }}>
      {children}
    </div>
    {(clipped || limit > PREVIEW_HEIGHT) && <div className="creation-feed-controls">
      {clipped && <button ref={moreButton} type="button" className="creation-feed-more" aria-controls="creation-feed-preview"
        aria-expanded={limit > PREVIEW_HEIGHT} onClick={() => setLimit(value => value + PREVIEW_HEIGHT)}>Show More</button>}
      {limit > PREVIEW_HEIGHT && <button type="button" className="creation-feed-less" aria-controls="creation-feed-preview" onClick={() => {
        setLimit(PREVIEW_HEIGHT)
        requestAnimationFrame(() => moreButton.current?.focus({ preventScroll: true }))
        const section = viewport.current?.closest('section')
        if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ behavior: 'instant', block: 'start' })
      }}>Show Less</button>}
    </div>}
  </div>
}

export default function CreationFeed() {
  const query = usePublicQuery(getCreations)
  const [opened, setOpened] = useState<{ post: Creation; trigger: HTMLButtonElement } | null>(null)
  const [category, setCategory] = useState('all')
  const close = useCallback(() => setOpened(null), [])
  const items = query.status === 'success' ? query.data.items : []
  const layout = query.status === 'success' ? query.data.layout : undefined
  const entries = new Map(layout?.entries.map(entry => [entry.id, entry]))
  const key = (post: Creation) => `${post.platform}:${post.id}`
  const ordered = [...items].sort((a,b) => Date.parse(b.publishedAt)-Date.parse(a.publishedAt) || `${b.platform}:${b.id}`.localeCompare(`${a.platform}:${a.id}`, 'en', { numeric: true }))
  const activeCategory = layout?.categories.some(c=>c.id===category) ? category : 'all'
  const arranged = ordered.filter(post=>activeCategory==='all' || entries.get(key(post))?.categoryIds.includes(activeCategory))
  return <section id="blog" className="creation-section" aria-labelledby="creation-heading">
    <div className="creation-section-heading">
      <h2 id="creation-heading">Blog</h2>
      {query.status === 'success' && query.data.mode === 'preview' && <p>公开推文预览 · 尚未连接个人创作账号</p>}
    </div>
    {!!layout?.categories.length && <nav className="creation-categories" aria-label="动态分类">{[{id:'all',name:'全部'},...layout.categories].map(c=><button key={c.id} aria-pressed={activeCategory===c.id} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</nav>}
    {query.status === 'loading'  && <div className="creation-grid" aria-busy="true" aria-label="正在加载动态">
      {[0, 1, 2].map(key => <div key={key} className="creation-loading" />)}
    </div>}
    {query.status === 'error' && <div className="creation-state" role="alert"><p>暂时无法加载动态。</p><button onClick={query.retry}>重新加载</button></div>}
    {query.status === 'success' && (query.data.items.length === 0
      ? <p className="creation-state">还没有发布的动态。</p>
      : !arranged.length ? <p className="creation-state">此分类下还没有动态。</p> : <FeedWindow key={activeCategory}><Masonry>
        {arranged.map(post => <article className={`creation-card creation-card-${cardSize(post)}`} key={`${post.platform}:${post.id}`} data-postid={key(post)} data-custom-layout={entries.has(key(post)) || undefined} data-layout-span={entries.get(key(post))?.span} style={{ '--creation-columns':(entries.get(key(post))?.span ?? 1)*4, '--creation-height': entries.get(key(post))?.height ? `${entries.get(key(post))!.height}px` : 'auto' } as CSSProperties}><div className="creation-card-content" onClick={event => {
          const trigger = event.currentTarget.querySelector<HTMLButtonElement>('.creation-card-open')
          if (trigger) setOpened({ post, trigger })
        }}><button type="button" className="creation-card-open"
          aria-label={`查看 ${post.author.name} 的动态${post.title ? `：${post.title}` : ''}`}
          aria-haspopup="dialog" />
          <CreationContent post={post} />
        </div><CreationActions post={post} /></article>)}
      </Masonry></FeedWindow>)}
    {opened && <CreationDialog post={opened.post} trigger={opened.trigger} onClosed={close} />}
  </section>
}
