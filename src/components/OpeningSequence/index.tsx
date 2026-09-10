import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TypingAnimation from '../TypingAnimation'
import './index.css'

// Choreographed milestones give resources time to load; they are not byte counts.
const PROGRESS_STEPS = [
  { value: 0, at: 0 },
  { value: 22, at: 0.75 },
  { value: 59, at: 1.6 },
  { value: 96, at: 2.55 },
  { value: 99, at: 3.4 },
] as const

export default function OpeningSequence({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const numberRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [complete, setComplete] = useState(false)
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
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
          restoreScrolling()
          setComplete(true)
          ScrollTrigger.refresh()
        },
      })

      for (const step of PROGRESS_STEPS.slice(1)) {
        timeline.call(() => setProgress(step.value), [], step.at)
        timeline.to(fillRef.current, {
          scaleY: step.value / 100,
          duration: reducedMotion ? 0 : 0.65,
        }, step.at)
      }

      timeline.addLabel('exit', 4.05)
      timeline.to(fillRef.current, { scaleY: 1, duration: 0.15 }, 'exit')
      timeline.to(barRef.current, {
        yPercent: reducedMotion ? 0 : -105,
        opacity: reducedMotion ? 0 : 1,
        duration: 0.65,
        ease: 'power3.in',
      }, 'exit+=0.1')
      timeline.to(numberRef.current, {
        y: reducedMotion ? 0 : -24,
        opacity: 0,
        duration: 0.35,
      }, 'exit+=0.25')
      timeline.to(overlayRef.current, { opacity: 0, duration: 0.55 }, 'exit+=0.55')
      timeline.fromTo(contentRef.current, {
        y: reducedMotion ? 0 : 88,
        opacity: 0,
      }, {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        // A persistent transform would change the containing block of fixed controls.
        clearProps: 'transform,opacity',
      }, 'exit+=0.4')
    }, rootRef)

    return () => {
      context.revert()
      restoreScrolling()
    }
  }, [reducedMotion])

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
              <TypingAnimation>{String(progress).padStart(2, '0')}</TypingAnimation>
            )}
          </div>
          <div ref={barRef} className="opening-bar" aria-hidden="true">
            <div ref={fillRef} className="opening-bar-fill" />
          </div>
        </div>
      )}
    </div>
  )
}
