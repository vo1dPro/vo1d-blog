import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { Book } from '@/types'

const SINGLE_PAGE = '(max-width: 639px), (max-height: 559px)'
type Layout = { pages: string[]; index: number; single: boolean }
type Turn = { from: number; to: number; direction: number; sequence: number }

// Measure real typeset text, splitting only at grapheme boundaries (including emoji).
function paginate(text: string, measure: HTMLElement) {
  if (!text) return ['']
  const ends = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
    part => part.index + part.segment.length)
  const pages: string[] = []
  let start = 0
  let offset = 0
  while (start < ends.length) {
    let low = start
    let high = ends.length - 1
    let fit = start
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      measure.textContent = text.slice(offset, ends[mid])
      if (measure.scrollHeight <= measure.clientHeight) {
        fit = mid
        low = mid + 1
      } else high = mid - 1
    }
    pages.push(text.slice(offset, ends[fit]))
    offset = ends[fit]
    start = fit + 1
  }
  measure.textContent = ''
  return pages
}

export default function BookPages({ book, titleId }: { book: Book; titleId: string }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLDivElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>({ pages: [''], index: 0, single: matchMedia(SINGLE_PAGE).matches })
  const [turn, setTurn] = useState<Turn | null>(null)
  const sequence = useRef(0)
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)
  const tap = useRef({ time: 0, x: 0, y: 0 })
  const lastTouch = useRef(0)
  const { pages, index, single } = layout
  const total = pages.length + 1
  const step = single ? 1 : 2

  useLayoutEffect(() => {
    const measure = measureRef.current
    if (!measure) return
    let disposed = false
    let frame = 0
    const reflow = () => {
      if (disposed || measure.clientHeight < 32 || measure.clientWidth < 1) return
      const nextPages = paginate(book.readingNotes ?? '', measure)
      const nextSingle = matchMedia(SINGLE_PAGE).matches
      setTurn(null)
      setLayout(previous => {
        // Keep the current reading position when fonts or viewport dimensions change.
        const offset = previous.pages.slice(0, Math.max(0, previous.index - 1)).join('').length
        let nextIndex = 0
        if (previous.index > 0) {
          let end = 0
          nextIndex = nextPages.findIndex(page => { end += page.length; return end > offset }) + 1
          if (!nextIndex) nextIndex = nextPages.length
        }
        if (!nextSingle) nextIndex = Math.floor(nextIndex / 2) * 2
        return { pages: nextPages, index: nextIndex, single: nextSingle }
      })
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(reflow) }
    const observer = new ResizeObserver(schedule)
    observer.observe(measure)
    window.addEventListener('resize', schedule)
    document.fonts.addEventListener('loadingdone', schedule)
    void document.fonts.ready.then(() => { if (!disposed) schedule() })
    schedule()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      document.fonts.removeEventListener('loadingdone', schedule)
    }
  }, [book.readingNotes])

  useLayoutEffect(() => {
    const sheet = turnRef.current
    if (!turn || !sheet) return
    const animation = sheet.animate([
      { transform: `translateZ(24px) rotateY(${turn.direction > 0 ? 0 : -180}deg)` },
      { transform: `translateZ(24px) rotateY(${turn.direction > 0 ? -180 : 0}deg)` },
    ], { duration: 580, easing: 'cubic-bezier(.22,.65,.25,1)', fill: 'forwards' })
    animation.onfinish = () => setTurn(current => current?.sequence === turn.sequence ? null : current)
    return () => animation.cancel()
  }, [turn])

  function go(direction: number) {
    if (surfaceRef.current?.closest('dialog')?.dataset.state !== 'open') return
    const next = index + direction * step
    if (next < 0 || next >= total) return
    setTurn(matchMedia('(prefers-reduced-motion: reduce)').matches ? null : {
      from: index, to: next, direction, sequence: ++sequence.current,
    })
    setLayout(previous => ({ ...previous, index: next }))
  }

  function doubleTap(x: number) {
    const surface = surfaceRef.current
    if (!surface) return
    const visible = surface.querySelector<HTMLElement>('.book-reader__right-page')!
    const bounds = visible.getBoundingClientRect()
    const center = single ? bounds.left + bounds.width / 2 : bounds.left
    go(x >= center ? 1 : -1)
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointer.current
    pointer.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      tap.current.time = 0
      go(dx < 0 ? 1 : -1)
    } else if (event.pointerType === 'touch' && Math.hypot(dx, dy) < 10) {
      const now = performance.now()
      lastTouch.current = now
      const previous = tap.current
      if (now - previous.time < 320 && Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 28) {
        doubleTap(event.clientX)
        tap.current.time = 0
      } else tap.current = { time: now, x: event.clientX, y: event.clientY }
    }
  }

  function pageContent(number: number, duplicate = false) {
    if (number >= total) return null
    return <>
      {number === 0 ? <div className="book-reader__title-page">
        <p className="book-reader__notes-title">读后心得</p>
        <h2 id={duplicate ? undefined : titleId}>{book.title}</h2>
        <p>{book.author}</p>
      </div> : pages[number - 1] ? <div className="book-reader__prose" aria-label="心得正文">{pages[number - 1]}</div>
        : <p className="book-reader__empty-notes">暂无读书心得</p>}
      <footer className="book-reader__folio">
        <span>{number === 0 ? `阅读进度 · ${Math.round(Math.max(0, Math.min(100, book.progress)))}%` : ''}</span>
        <span>{String(number + 1).padStart(2, '0')}</span>
      </footer>
    </>
  }

  return <>
    <div ref={surfaceRef} className="book-reader__pages" role="group" aria-label="书页，双击右侧或左滑前进，双击左侧或右滑后退" tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(event.key === 'ArrowRight' ? 1 : -1) }
      }}
      onDoubleClick={event => { if (performance.now() - lastTouch.current > 700) { event.preventDefault(); doubleTap(event.clientX) } }}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerUp={pointerUp} onPointerCancel={() => { pointer.current = null; tap.current.time = 0 }}>
      {!single && <section className="book-reader__left-page">{pageContent(turn && turn.direction > 0 ? turn.from : index)}</section>}
      <section className="book-reader__right-page">{pageContent((turn && turn.direction < 0 ? turn.from : index) + (single ? 0 : 1))}</section>
      {turn && <div ref={turnRef} className="book-reader__turn-sheet" aria-hidden="true">
        <div className="book-reader__turn-face">{pageContent(turn.direction > 0 ? (single ? turn.from : turn.from + 1) : (single ? turn.to : turn.to + 1), true)}</div>
        <div className="book-reader__turn-face book-reader__turn-face--back">{pageContent(turn.direction > 0 ? turn.to : turn.from, true)}</div>
      </div>}
    </div>
    <section className="book-reader__right-page book-reader__measure" aria-hidden="true" inert>
      <div ref={measureRef} className="book-reader__prose" />
      <footer className="book-reader__folio"><span>00</span></footer>
    </section>
    <nav className="book-reader__pagination" aria-label="书本翻页">
      <button type="button" disabled={index === 0} onClick={() => go(-1)}>上一页</button>
      <span aria-live="polite">{single ? index + 1 : `${index + 1}–${Math.min(index + 2, total)}`} / {total}</span>
      <button type="button" disabled={index + step >= total} onClick={() => go(1)}>下一页</button>
    </nav>
  </>
}
