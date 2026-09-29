import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'

type Sample = { time: number; position: number }
type Drag = {
  pointerId: number
  startY: number
  startScroll: number
  moved: boolean
  samples: Sample[]
}

// Velocity is measured in local scroll pixels/ms, independent of the phone's scale.
const SAMPLE_WINDOW_MS = 100
const DECAY_MS = 280
const MIN_SPEED = 0.02
const MAX_SPEED = 3

export function useLibraryDragScroll(scale: number, enabled: boolean, gameId: number) {
  const dragRef = useRef<Drag | null>(null)
  const frameRef = useRef<number | null>(null)
  const suppressClickRef = useRef(false)

  const stopMomentum = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }, [])

  useEffect(() => {
    const cancel = () => {
      stopMomentum()
      dragRef.current = null
    }
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('blur', cancel)
    motionQuery.addEventListener('change', cancel)
    return () => {
      cancel()
      window.removeEventListener('blur', cancel)
      motionQuery.removeEventListener('change', cancel)
    }
  }, [enabled, gameId, scale, stopMomentum])

  function startMomentum(element: HTMLDivElement, speed: number) {
    stopMomentum()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed))
    let position = element.scrollTop
    let previousTime = performance.now()
    const tick = (time: number) => {
      const elapsed = time - previousTime
      previousTime = time
      const decay = Math.exp(-elapsed / DECAY_MS)
      position += velocity * DECAY_MS * (1 - decay)
      velocity *= decay
      const maxScroll = Math.max(0, element.scrollHeight - element.clientHeight)
      position = Math.max(0, Math.min(maxScroll, position))
      element.scrollTop = position
      if (position <= 0 || position >= maxScroll || Math.abs(velocity) < MIN_SPEED) {
        frameRef.current = null
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }
    if (Math.abs(velocity) >= MIN_SPEED) frameRef.current = requestAnimationFrame(tick)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || !event.isPrimary || event.button !== 0) return
    stopMomentum()
    suppressClickRef.current = false
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScroll: event.currentTarget.scrollTop,
      moved: false,
      samples: [{ time: event.timeStamp, position: event.currentTarget.scrollTop }],
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaY) > 8) {
      drag.moved = true
      suppressClickRef.current = true
    }
    // Touch retains native scrolling and momentum; only mouse dragging is simulated.
    if (drag.moved && event.pointerType === 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
      event.currentTarget.scrollTop = drag.startScroll - deltaY / scale
      drag.samples.push({ time: event.timeStamp, position: event.currentTarget.scrollTop })
      drag.samples = drag.samples.filter(sample => event.timeStamp - sample.time <= SAMPLE_WINDOW_MS)
    }
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.type !== 'pointerup') suppressClickRef.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (event.type !== 'pointerup' || event.pointerType !== 'mouse' || !drag.moved) return
    const first = drag.samples.find(sample => event.timeStamp - sample.time <= SAMPLE_WINDOW_MS)
    if (!first) return // Holding still before release must not launch stale momentum.
    const elapsed = event.timeStamp - first.time
    if (elapsed > 0) startMomentum(event.currentTarget, (event.currentTarget.scrollTop - first.position) / elapsed)
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) onPointerEnd(event)
  }

  function shouldSuppressClick(event: MouseEvent<HTMLButtonElement>) {
    // Keyboard activation remains available immediately after a drag.
    return event.detail !== 0 && suppressClickRef.current
  }

  return {
    shouldSuppressClick,
    stopMomentum,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onLostPointerCapture: onPointerEnd,
      onPointerLeave,
      onWheel: stopMomentum,
      onKeyDown: stopMomentum,
    },
  }
}
