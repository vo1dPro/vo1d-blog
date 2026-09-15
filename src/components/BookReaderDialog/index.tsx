import { useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { animate } from 'motion'
import type { Book } from '@/types'
import BookPages from './BookPages'
import './index.css'

interface BookReaderDialogProps {
  book: Book
  trigger: HTMLButtonElement
  sourceCover: HTMLImageElement
  onClosed: () => void
}

const STRIPS = 32
const LEAVES = [0, 1, 2]
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// Measure the visible image, accounting for the card's object-fit: contain.
function coverBounds(image: HTMLImageElement) {
  const bounds = image.getBoundingClientRect()
  const ratio = image.naturalWidth / image.naturalHeight || 0.72
  const width = Math.min(bounds.width, bounds.height * ratio)
  const height = width / ratio
  return { left: bounds.left + (bounds.width - width) / 2, top: bounds.top + (bounds.height - height) / 2, width, height }
}

export default function BookReaderDialog({ book, trigger, sourceCover, onClosed }: BookReaderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const requestClose = useRef<() => void>(() => {})
  const titleId = useId()

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const scene = sceneRef.current
    const content = contentRef.current
    if (!dialog || !scene || !content) return
    const front = scene.querySelector<HTMLElement>('.book-reader__front')!
    const leaves = Array.from(scene.querySelectorAll<HTMLElement>('.book-reader__leaf'))
      .map(leaf => Array.from(leaf.children) as HTMLElement[])
    const scrim = dialog.querySelector<HTMLElement>('.book-reader__scrim')!
    const body = document.body
    const scrollY = window.scrollY
    const oldStyles = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let progress = 0
    let closing = false
    let disposed = false
    let playback: ReturnType<typeof animate> | undefined
    let origin = coverBounds(sourceCover)

    dialog.showModal()
    dialog.focus({ preventScroll: true })
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${padding + scrollbar}px`

    const paint = (value: number) => {
      progress = value
      const vw = window.innerWidth
      const vh = window.innerHeight
      const singlePage = vw < 640 || vh < 560
      const pageWidth = singlePage ? Math.min(vw - 40, 380) : Math.min(420, (vw - 112) / 2, (vh - 170) * 0.72)
      const pageHeight = singlePage ? Math.max(150, Math.min(vh - (vh < 560 ? 112 : 180), 570)) : pageWidth / 0.72
      const travel = smooth(value / 0.56)
      const open = smooth((value - 0.26) / 0.64)
      const reveal = smooth((value - 0.83) / 0.17)
      // Narrow screens use this centered surface for either page, starting at 01.
      const endX = singlePage ? -pageWidth / 2 : 0
      const startX = origin.left - vw / 2
      const startY = origin.top + origin.height / 2 - vh / 2
      const x = startX * (1 - travel) + endX * travel
      const y = startY * (1 - travel) - Math.sin(Math.PI * travel) * 42
      const sx = origin.width / pageWidth + (1 - origin.width / pageWidth) * travel
      const sy = origin.height / pageHeight + (1 - origin.height / pageHeight) * travel
      scene.style.width = `${pageWidth}px`
      scene.style.height = `${pageHeight}px`
      scene.style.marginTop = `${-pageHeight / 2}px`
      scene.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${sx}, ${sy}) rotateX(${Math.sin(Math.PI * travel) * 9}deg) rotateZ(${-Math.sin(Math.PI * travel) * 4}deg)`
      front.style.transform = `translateZ(5px) rotateY(${-180 * open}deg)`
      scrim.style.opacity = String(smooth(value / 0.35))
      content.style.opacity = String(reveal)
      content.inert = value < 0.99 || closing
      scene.style.setProperty('--book-shadow', String(travel))
      scene.style.setProperty('--left-page-opacity', String(singlePage ? 1 - reveal : 1))
      dialog.dataset.state = closing ? 'closing' : value >= 0.999 ? 'open' : 'opening'
      dialog.style.setProperty('--chrome-opacity', String(smooth(value / 0.18)))

      // Like the reference's subdivided sheets, local tangent angles form a
      // continuous paper curve. Integrating them keeps each strip connected.
      leaves.forEach((strips, leafIndex) => {
        const turn = smooth((value - 0.34 - leafIndex * 0.055) / 0.52)
        const curl = Math.sin(Math.PI * turn) * 1.15
        const step = pageWidth / STRIPS
        let px = 0
        let pz = 8 + leafIndex * 0.8
        strips.forEach((strip, index) => {
          const angle = -Math.PI * turn + curl * (index / (STRIPS - 1) - 0.5)
          strip.style.width = `${step + 0.6}px`
          strip.style.transform = `translate3d(${px}px, 0, ${pz}px) rotateY(${angle}rad)`
          strip.style.filter = `brightness(${0.95 + 0.05 * Math.cos(angle)})`
          px += step * Math.cos(angle)
          pz -= step * Math.sin(angle)
        })
      })
      // The hardcover must occlude the sheets before their turn begins.
      front.style.zIndex = open < 0.5 ? '5' : '1'
    }

    function finish() {
      if (!disposed) onClosed()
    }
    requestClose.current = () => {
      if (closing) return
      closing = true
      playback?.stop()
      origin = coverBounds(sourceCover)
      content.inert = true
      dialog.focus({ preventScroll: true })
      playback = animate(progress, 0, { duration: reduced.matches ? 0.01 : Math.max(0.12, progress * 1.05), ease: 'linear', onUpdate: paint, onComplete: finish })
    }
    function resize() { origin = coverBounds(sourceCover); paint(progress) }
    function reduceMotionChanged() {
      playback?.stop()
      if (closing) finish()
      else paint(1)
    }

    paint(reduced.matches ? 1 : 0)
    if (!reduced.matches) playback = animate(0, 1, { duration: 1.45, ease: 'linear', onUpdate: paint })
    window.addEventListener('resize', resize)
    reduced.addEventListener('change', reduceMotionChanged)

    return () => {
      disposed = true
      playback?.stop()
      requestClose.current = () => {}
      window.removeEventListener('resize', resize)
      reduced.removeEventListener('change', reduceMotionChanged)
      dialog.close()
      Object.assign(body.style, oldStyles)
      const html = document.documentElement
      const behavior = html.style.scrollBehavior
      html.style.scrollBehavior = 'auto'
      window.scrollTo(0, scrollY)
      html.style.scrollBehavior = behavior
      if (trigger.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [book.id, sourceCover, trigger, onClosed])

  return createPortal(
    <dialog
      ref={dialogRef}
      className="book-reader"
      aria-label={book.title}
      onCancel={event => { event.preventDefault(); requestClose.current() }}
      data-lenis-prevent
    >
      <div className="book-reader__scrim" onClick={() => requestClose.current()} aria-hidden="true" />
      <div className="book-reader__perspective">
        <div className="book-reader__scene" ref={sceneRef}>
          <div className="book-reader__back-board" />
          <div className="book-reader__page-block" />
          <div className="book-reader__front" aria-hidden="true">
            <div className="book-reader__cover-face"><img src={book.cover} alt="" /><span className="book-reader__cover-spine" /></div>
            <div className="book-reader__cover-inside" />
          </div>
          {LEAVES.map(leaf => <div className="book-reader__leaf" key={leaf} aria-hidden="true">
            {Array.from({ length: STRIPS }, (_, index) => <span key={index} />)}
          </div>)}
          <div ref={contentRef} className="book-reader__content">
            <BookPages book={book} titleId={titleId} />
          </div>
        </div>
      </div>

    </dialog>,
    document.body,
  )
}
