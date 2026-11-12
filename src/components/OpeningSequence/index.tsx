import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import NumberTicker from '../NumberTicker'
import { WORD_ROWS, wordBlocks, wordColumns, wordViewBox } from '@/lib/pixel-glyphs'
import './index.css'

// Choreographed milestones give resources time to load; they are not byte counts.
const PROGRESS_STEPS = [
  { value: 0, at: 0 },
  { value: 22, at: 0.75 },
  { value: 59, at: 1.6 },
  { value: 96, at: 2.55 },
  { value: 99, at: 3.4 },
  { value: 100, at: 3.75 },
] as const

// A critically damped spring settles each milestone within the short opening.
const TICKER_SPRING = { damping: 40, stiffness: 400 }
const OPENING_SEEN_KEY = 'vo1d-blog:opening-seen'
let openingCompleted = false

const LOGO_BLOCKS = wordBlocks('VO1D')
const LOGO_VIEW_BOX = wordViewBox('VO1D')
const LOGO_COLUMNS = wordColumns(4)
// Blocks light up roughly left to right, with enough jitter to feel like pixels loading in.
const LIGHT_ORDER = LOGO_BLOCKS
  .map((block, index) => ({ index, key: block.letter * 3 + block.col + Math.random() * 2.5 }))
  .sort((a, b) => a.key - b.key)
  .reduce<number[]>((rank, entry, position) => { rank[entry.index] = position; return rank }, [])

function hasSeenOpening() {
  try {
    return openingCompleted || window.sessionStorage.getItem(OPENING_SEEN_KEY) === '1'
  } catch {
    // Storage can be unavailable; still avoid replaying on component remounts.
    return openingCompleted
  }
}

function rememberOpening() {
  openingCompleted = true
  try {
    window.sessionStorage.setItem(OPENING_SEEN_KEY, '1')
  } catch {
    // A blocked storage API must not prevent the page from becoming usable.
  }
}

export default function OpeningSequence({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<SVGSVGElement>(null)
  const exitingRef = useRef(false)
  const [progress, setProgress] = useState(0)
  const [skipOpening] = useState(hasSeenOpening)
  const [complete, setComplete] = useState(skipOpening)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  // Progress lights the wordmark block by block, so the loader ends as the finished logo.
  const lightLogo = useCallback((value: number) => {
    const lit = Math.round((Math.min(100, Math.max(0, value)) / 100) * LOGO_BLOCKS.length)
    logoRef.current?.querySelectorAll<SVGPathElement>('path').forEach((path, index) => {
      path.dataset.lit = String(LIGHT_ORDER[index] < lit)
    })
  }, [])

  const syncProgress = useCallback((value: number) => {
    if (!exitingRef.current) lightLogo(value)
  }, [lightLogo])

  // Sit the loader's wordmark exactly where the hero canvas will paint it.
  useLayoutEffect(() => {
    if (skipOpening) return
    const place = () => {
      const logo = logoRef.current
      const box = contentRef.current?.querySelector('.hero__logo')?.getBoundingClientRect()
      if (!logo || !box) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cell = Math.max(2, Math.floor((box.width * dpr) / LOGO_COLUMNS))
      const width = cell * LOGO_COLUMNS
      const height = cell * WORD_ROWS
      logo.style.left = `${Math.round(box.left * dpr + (box.width * dpr - width) / 2) / dpr}px`
      logo.style.top = `${Math.round(box.top * dpr + (box.height * dpr - height) / 2) / dpr}px`
      logo.style.width = `${width / dpr}px`
      logo.style.height = `${height / dpr}px`
      logo.style.transform = 'none'
      // The counter hangs centred beneath the wordmark.
      overlayRef.current?.style.setProperty('--opening-logo-bottom', `${(Math.round(box.top * dpr + (box.height * dpr - height) / 2) + height) / dpr}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', place)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [skipOpening])

  useEffect(() => {
    if (skipOpening) return

    exitingRef.current = false
    const html = document.documentElement
    const previousOverflow = html.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const restoreScrolling = () => {
      html.style.overflow = previousOverflow
      document.body.style.overflow = previousBodyOverflow
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          rememberOpening()
          restoreScrolling()
          setComplete(true)
          ScrollTrigger.refresh()
        },
      })

      for (const step of PROGRESS_STEPS.slice(1)) {
        timeline.call(() => setProgress(step.value), [], step.at)
        if (reducedMotion) {
          timeline.call(() => lightLogo(step.value), [], step.at)
        }
      }

      timeline.addLabel('exit', 4.05)
      timeline.call(() => {
        exitingRef.current = true
        lightLogo(100)
      }, [], 'exit')
      timeline.to(numberRef.current, {
        y: reducedMotion ? 0 : -24,
        opacity: 0,
        duration: 0.35,
      }, 'exit+=0.25')
      // The page takes over with its wordmark already assembled under the loader's copy,
      // so the logo never moves while the screen dissolves around it.
      timeline.call(() => { document.documentElement.dataset.openingHandoff = '1' }, [], 'exit+=0.35')
      timeline.set(contentRef.current, { opacity: 1 }, 'exit+=0.5')
      timeline.to(overlayRef.current, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 'exit+=0.55')
    }, rootRef)

    return () => {
      context.revert()
      restoreScrolling()
    }
  }, [lightLogo, reducedMotion, skipOpening])

  return (
    <div ref={rootRef} className="opening-sequence" data-complete={complete}>
      <div ref={contentRef} className="opening-content" inert={!complete} aria-hidden={!complete}>
        {children}
      </div>
      {!complete && (
        <div ref={overlayRef} className="opening-screen" data-lenis-prevent>
          <span className="sr-only" role="status">正在准备页面，请稍候。</span>
          <div ref={numberRef} className="opening-number" aria-hidden="true">
            {reducedMotion ? String(progress).padStart(2, '0') : (
              <NumberTicker
                value={progress}
                minimumIntegerDigits={2}
                springOptions={TICKER_SPRING}
                onValueChange={syncProgress}
              />
            )}
          </div>
          <svg ref={logoRef} className="opening-logo" viewBox={LOGO_VIEW_BOX} aria-hidden="true">
            {LOGO_BLOCKS.map(block => <path key={`${block.letter}-${block.col}-${block.row}`} d={block.path} data-lit="false" />)}
          </svg>
        </div>
      )}
    </div>
  )
}
