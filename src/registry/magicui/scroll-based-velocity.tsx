import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import type { MotionValue } from 'motion/react'

import { cn } from '@/lib/utils'
import { ScrollVelocityCopyContext } from './scroll-velocity-copy-context'

interface ScrollVelocityRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  baseVelocity?: number
  direction?: 1 | -1
  paused?: boolean
  pauseOnHover?: boolean
  scrollReactivity?: boolean
}

const wrap = (min: number, max: number, value: number) => {
  const rangeSize = max - min
  return ((((value - min) % rangeSize) + rangeSize) % rangeSize) + min
}

// Ignore stale scroll velocity after a pause (for example, modal scroll restoration).
const SCROLL_BOOST_RESUME_DELAY_MS = 1000

const ScrollVelocityContext = React.createContext<MotionValue<number> | null>(null)

export function ScrollVelocityContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  })
  const velocityFactor = useTransform(smoothVelocity, (value) => {
    const sign = value < 0 ? -1 : 1
    const magnitude = Math.min(5, (Math.abs(value) / 1000) * 5)
    return sign * magnitude
  })

  return (
    <ScrollVelocityContext.Provider value={velocityFactor}>
      <div className={cn('relative w-full', className)} {...props}>
        {children}
      </div>
    </ScrollVelocityContext.Provider>
  )
}

export function ScrollVelocityRow(props: ScrollVelocityRowProps) {
  const sharedVelocityFactor = useContext(ScrollVelocityContext)

  if (sharedVelocityFactor) {
    return <ScrollVelocityRowImpl {...props} velocityFactor={sharedVelocityFactor} />
  }

  return <ScrollVelocityRowLocal {...props} />
}

interface ScrollVelocityRowImplProps extends ScrollVelocityRowProps {
  velocityFactor: MotionValue<number>
}

function ScrollVelocityRowImpl({
  children,
  baseVelocity = 5,
  direction = 1,
  className,
  velocityFactor,
  paused = false,
  pauseOnHover = false,
  scrollReactivity = true,
  onPointerEnter,
  onPointerLeave,
  onPointerCancel,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ScrollVelocityRowImplProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const [numCopies, setNumCopies] = useState(1)

  const baseX = useMotionValue(0)
  const baseDirectionRef = useRef(direction >= 0 ? 1 : -1)
  const currentDirectionRef = useRef(direction >= 0 ? 1 : -1)
  const unitWidth = useMotionValue(0)

  const isInViewRef = useRef(true)
  const isPageVisibleRef = useRef(true)
  const prefersReducedMotionRef = useRef(false)
  const pointerInsideRef = useRef(false)
  const focusInsideRef = useRef(false)
  const scrollBoostResumeTimeRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    const block = blockRef.current
    let resizeObserver: ResizeObserver | null = null
    let intersectionObserver: IntersectionObserver | null = null
    let reducedMotionQuery: MediaQueryList | null = null

    const handleVisibility = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible'
    }

    const handleReducedMotion = () => {
      if (reducedMotionQuery) {
        prefersReducedMotionRef.current = reducedMotionQuery.matches
      }
    }

    if (container && block) {
      const updateSizes = () => {
        const containerWidth = container.offsetWidth || 0
        const blockWidth = block.scrollWidth || 0
        unitWidth.set(blockWidth)
        const nextCopies = blockWidth > 0
          ? Math.max(3, Math.ceil(containerWidth / blockWidth) + 2)
          : 1

        setNumCopies((current) => current === nextCopies ? current : nextCopies)
      }

      updateSizes()

      resizeObserver = new ResizeObserver(updateSizes)
      resizeObserver.observe(container)
      resizeObserver.observe(block)

      intersectionObserver = new IntersectionObserver(([entry]) => {
        isInViewRef.current = entry.isIntersecting
      })
      intersectionObserver.observe(container)

      document.addEventListener('visibilitychange', handleVisibility, { passive: true })
      handleVisibility()

      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotionQuery.addEventListener('change', handleReducedMotion)
      handleReducedMotion()
    }

    return () => {
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      reducedMotionQuery?.removeEventListener('change', handleReducedMotion)
    }
  }, [unitWidth])

  const x = useTransform([baseX, unitWidth], ([value, blockWidth]) => {
    const width = Number(blockWidth) || 1
    const offset = Number(value) || 0
    return `${-wrap(0, width, offset)}px`
  })

  useAnimationFrame((time, delta) => {
    const interactionPaused = pauseOnHover
      && (pointerInsideRef.current || focusInsideRef.current)
    const shouldPause = paused
      || interactionPaused
      || !isInViewRef.current
      || !isPageVisibleRef.current
      || prefersReducedMotionRef.current

    if (shouldPause) {
      scrollBoostResumeTimeRef.current = time + SCROLL_BOOST_RESUME_DELAY_MS
      return
    }

    const deltaSeconds = delta / 1000
    const measuredVelocity = scrollReactivity ? velocityFactor.get() : 0
    const shouldSuppressScrollBoost = time < scrollBoostResumeTimeRef.current
    const velocity = shouldSuppressScrollBoost ? 0 : measuredVelocity
    const absoluteVelocity = Math.min(5, Math.abs(velocity))

    if (absoluteVelocity > 0.1) {
      const scrollDirection = velocity >= 0 ? 1 : -1
      currentDirectionRef.current = baseDirectionRef.current * scrollDirection
    }

    const blockWidth = unitWidth.get() || 0
    if (blockWidth <= 0) return

    const pixelsPerSecond = (blockWidth * baseVelocity) / 100
    const speedMultiplier = 1 + absoluteVelocity
    const moveBy = currentDirectionRef.current
      * pixelsPerSecond
      * speedMultiplier
      * deltaSeconds

    baseX.set(baseX.get() + moveBy)
  })

  return (
    <div
      {...props}
      ref={containerRef}
      className={cn('w-full overflow-hidden whitespace-nowrap', className)}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          pointerInsideRef.current = true
        }
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        pointerInsideRef.current = false
        onPointerLeave?.(event)
      }}
      onPointerCancel={(event) => {
        pointerInsideRef.current = false
        onPointerCancel?.(event)
      }}
      onFocusCapture={(event) => {
        const focusedElement = event.target
        const hasKeyboardFocus = focusedElement instanceof HTMLElement
          && focusedElement.matches(':focus-visible')
        focusInsideRef.current = hasKeyboardFocus

        if (hasKeyboardFocus && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          const focusedRect = focusedElement.getBoundingClientRect()
          const revealPadding = Math.min(24, containerRect.width / 4)
          let horizontalShift = 0

          if (focusedRect.left < containerRect.left + revealPadding) {
            horizontalShift = containerRect.left + revealPadding - focusedRect.left
          } else if (focusedRect.right > containerRect.right - revealPadding) {
            horizontalShift = containerRect.right - revealPadding - focusedRect.right
          }

          if (horizontalShift !== 0) {
            const blockWidth = unitWidth.get()
            if (blockWidth > 0) {
              const currentOffset = baseX.get()
              const wrappedOffset = wrap(0, blockWidth, currentOffset)
              const nextWrappedOffset = Math.max(
                0,
                Math.min(blockWidth - 0.001, wrappedOffset - horizontalShift),
              )

              baseX.set(currentOffset - wrappedOffset + nextWrappedOffset)
            }
          }
        }

        onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          focusInsideRef.current = false
        }
        onBlurCapture?.(event)
      }}
    >
      <motion.div
        className="inline-flex transform-gpu items-center will-change-transform select-none"
        style={{ x }}
      >
        {Array.from({ length: numCopies }).map((_, index) => (
          <ScrollVelocityCopyContext.Provider key={index} value={index}>
            <div
              ref={index === 0 ? blockRef : null}
              aria-hidden={index !== 0}
              className="inline-flex shrink-0 items-center"
            >
              {children}
            </div>
          </ScrollVelocityCopyContext.Provider>
        ))}
      </motion.div>
    </div>
  )
}

function ScrollVelocityRowLocal(props: ScrollVelocityRowProps) {
  const { scrollY } = useScroll()
  const localVelocity = useVelocity(scrollY)
  const localSmoothVelocity = useSpring(localVelocity, {
    damping: 50,
    stiffness: 400,
  })
  const localVelocityFactor = useTransform(localSmoothVelocity, (value) => {
    const sign = value < 0 ? -1 : 1
    const magnitude = Math.min(5, (Math.abs(value) / 1000) * 5)
    return sign * magnitude
  })

  return <ScrollVelocityRowImpl {...props} velocityFactor={localVelocityFactor} />
}
