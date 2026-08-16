import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FocusEvent, PointerEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

const PREVIEW_WIDTH = 224
const PREVIEW_HEIGHT = 140
const SCREENSHOT_VIEWPORT_WIDTH = 1280
const SCREENSHOT_VIEWPORT_HEIGHT = 800
const PREVIEW_GAP = 12
const VIEWPORT_MARGIN = 12
const OPEN_DELAY = 80
const CLOSE_DELAY = 140

type PreviewPlacement = 'top' | 'bottom'

type PreviewPosition = {
  left: number
  top: number
  placement: PreviewPlacement
}

type SocialLinkPreviewProps = {
  children: ReactNode
  className?: string
  href: string
  name: string
}

function getPreviewImageUrl(url: string) {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': 'false',
    'viewport.deviceScaleFactor': '1',
    'viewport.width': String(SCREENSHOT_VIEWPORT_WIDTH),
    'viewport.height': String(SCREENSHOT_VIEWPORT_HEIGHT),
  })

  return `https://api.microlink.io/?${params.toString()}`
}

function isInside(element: HTMLElement | null, target: EventTarget | null) {
  return target instanceof Node && element?.contains(target)
}

export function SocialLinkPreview({ children, className, href, name }: SocialLinkPreviewProps) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const previewRef = useRef<HTMLAnchorElement>(null)
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [position, setPosition] = useState<PreviewPosition>({
    left: VIEWPORT_MARGIN,
    top: VIEWPORT_MARGIN,
    placement: 'bottom',
  })
  const prefersReducedMotion = useReducedMotion()
  const pointerOffset = useMotionValue(0)
  const previewOffsetX = useSpring(pointerOffset, { stiffness: 160, damping: 18 })
  const imageUrl = useMemo(() => getPreviewImageUrl(href), [href])

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
  }, [])

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const updatePosition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return

    const hasRoomAbove = rect.top - PREVIEW_GAP >= PREVIEW_HEIGHT + VIEWPORT_MARGIN
    const placement: PreviewPlacement = hasRoomAbove ? 'top' : 'bottom'
    const desiredLeft = rect.left + rect.width / 2 - PREVIEW_WIDTH / 2
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN)
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_MARGIN)

    setPosition({
      left: Math.min(Math.max(desiredLeft, VIEWPORT_MARGIN), maxLeft),
      top:
        placement === 'top'
          ? Math.max(VIEWPORT_MARGIN, rect.top - PREVIEW_HEIGHT - PREVIEW_GAP)
          : Math.min(maxTop, rect.bottom + PREVIEW_GAP),
      placement,
    })
  }, [])

  const openPreview = useCallback(
    (delay = OPEN_DELAY) => {
      clearCloseTimer()
      clearOpenTimer()
      updatePosition()

      if (isOpen || delay === 0) {
        setIsOpen(true)
        return
      }

      openTimerRef.current = setTimeout(() => {
        updatePosition()
        setIsOpen(true)
        openTimerRef.current = null
      }, delay)
    },
    [clearCloseTimer, clearOpenTimer, isOpen, updatePosition],
  )

  const closePreview = useCallback(() => {
    clearOpenTimer()
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false)
      closeTimerRef.current = null
    }, CLOSE_DELAY)
  }, [clearCloseTimer, clearOpenTimer])

  const updatePointerOffset = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const offsetFromCenter = (event.clientX - rect.left - rect.width / 2) * 0.45
      pointerOffset.set(Math.max(-12, Math.min(12, offsetFromCenter)))
    },
    [pointerOffset],
  )

  const handleAnchorPointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      if (event.pointerType === 'touch') return
      updatePointerOffset(event)
      openPreview()
    },
    [openPreview, updatePointerOffset],
  )

  const handleAnchorPointerLeave = useCallback(() => {
    closePreview()
  }, [closePreview])

  const handleAnchorFocus = useCallback(() => {
    openPreview(0)
  }, [openPreview])

  const handleAnchorBlur = useCallback(
    (event: FocusEvent<HTMLAnchorElement>) => {
      if (!isInside(previewRef.current, event.relatedTarget)) {
        closePreview()
      }
    },
    [closePreview],
  )

  const handlePreviewPointerEnter = useCallback(() => {
    clearCloseTimer()
  }, [clearCloseTimer])

  const handlePreviewBlur = useCallback(
    (event: FocusEvent<HTMLAnchorElement>) => {
      if (!isInside(anchorRef.current, event.relatedTarget)) {
        closePreview()
      }
    },
    [closePreview],
  )

  useEffect(() => {
    return () => {
      clearOpenTimer()
      clearCloseTimer()
    }
  }, [clearCloseTimer, clearOpenTimer])

  useEffect(() => {
    if (!isOpen) return

    const handleViewportChange = () => updatePosition()
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [isOpen, updatePosition])

  const verticalOffset = position.placement === 'top' ? 14 : -14
  const initialAnimation = prefersReducedMotion ? false : { opacity: 0, y: verticalOffset, scale: 0.88 }
  const exitAnimation = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: verticalOffset, scale: 0.88 }

  return (
    <>
      <a
        ref={anchorRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={name}
        title={name}
        className={className}
        onPointerEnter={handleAnchorPointerEnter}
        onPointerMove={updatePointerOffset}
        onPointerLeave={handleAnchorPointerLeave}
        onFocus={handleAnchorFocus}
        onBlur={handleAnchorBlur}
      >
        {children}
      </a>

      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {isOpen && (
                <motion.a
                  ref={previewRef}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`打开 ${name} 主页预览`}
                  className="social-link-preview"
                  style={{ left: position.left, top: position.top, x: previewOffsetX }}
                  initial={initialAnimation}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={exitAnimation}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  onPointerEnter={handlePreviewPointerEnter}
                  onPointerLeave={closePreview}
                  onFocus={handlePreviewPointerEnter}
                  onBlur={handlePreviewBlur}
                >
                  <span className="social-link-preview__media">
                    <span className="social-link-preview__fallback" aria-hidden="true">
                      <strong>{name}</strong>
                      <small>Open profile</small>
                    </span>
                    {!imageFailed && (
                      <img
                        src={imageUrl}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        alt=""
                        className="social-link-preview__image"
                        onError={() => setImageFailed(true)}
                      />
                    )}
                  </span>
                </motion.a>
              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  )
}
