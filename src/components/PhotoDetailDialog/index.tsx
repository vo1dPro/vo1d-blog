import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'

import type { Photo } from '@/types'
import ContentImage from '../ContentImage'

interface PhotoDetailDialogProps {
  photo: Photo | null
  onClose: () => void
  onExitComplete: () => void
  returnFocusRef: RefObject<HTMLElement | null>
}

interface PhotoDetailDialogContentProps {
  photo: Photo
  onClose: (restoreFocusVisible: boolean) => void
  titleId: string
  descriptionId: string
  shouldReduceMotion: boolean
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function DetailPhotoImage({ photo }: { photo: Photo }) {
  const [displaySrc, setDisplaySrc] = useState(photo.thumbnailSrc)

  useEffect(() => {
    let cancelled = false
    let decodeFailed = false
    const fullImage = new Image()

    const showFullImage = () => {
      if (!cancelled) {
        setDisplaySrc(photo.src)
      }
    }

    const handleLoad = () => {
      if (decodeFailed) {
        showFullImage()
      }
    }

    fullImage.addEventListener('load', handleLoad, { once: true })
    fullImage.src = photo.src

    if (typeof fullImage.decode === 'function') {
      void fullImage.decode().then(showFullImage).catch(() => {
        decodeFailed = true
        if (fullImage.complete && fullImage.naturalWidth > 0) {
          showFullImage()
        }
      })
    } else {
      decodeFailed = true
    }

    return () => {
      cancelled = true
      fullImage.removeEventListener('load', handleLoad)
    }
  }, [photo])

  return (
    <ContentImage
      src={displaySrc}
      alt={photo.alt}
      width={720}
      height={480}
      decoding="async"
      className="h-full w-full object-contain"
    />
  )
}

function PhotoDetailDialogContent({
  photo,
  onClose,
  titleId,
  descriptionId,
  shouldReduceMotion,
}: PhotoDetailDialogContentProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = document.getElementById('root')
    const body = document.body
    const html = document.documentElement
    const scrollY = window.scrollY
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth)
    const computedBodyPaddingRight = Number.parseFloat(
      window.getComputedStyle(body).paddingRight,
    ) || 0
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }
    const previousScrollBehavior = html.style.scrollBehavior
    const previousRootInert = root?.inert ?? false
    const previousRootAriaHidden = root?.getAttribute('aria-hidden') ?? null

    closeButtonRef.current?.focus({ preventScroll: true })

    if (root) {
      root.inert = true
      root.setAttribute('aria-hidden', 'true')
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${computedBodyPaddingRight + scrollbarWidth}px`
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose(true)
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (!firstElement || !lastElement) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      body.style.overflow = previousBodyStyles.overflow
      body.style.paddingRight = previousBodyStyles.paddingRight
      html.style.scrollBehavior = 'auto'
      window.scrollTo(0, scrollY)
      html.style.scrollBehavior = previousScrollBehavior

      if (root) {
        root.inert = previousRootInert
        if (previousRootAriaHidden === null) {
          root.removeAttribute('aria-hidden')
        } else {
          root.setAttribute('aria-hidden', previousRootAriaHidden)
        }
      }
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md sm:p-8 motion-reduce:backdrop-blur-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0.15 : 0.2 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose(false)
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-card text-card-foreground shadow-2xl"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
        transition={shouldReduceMotion
          ? { duration: 0.15 }
          : { type: 'spring', bounce: 0, duration: 0.32 }}
      >
        <div className="relative aspect-[3/2] min-h-0 w-full shrink overflow-hidden bg-black/90">
          <DetailPhotoImage key={`${photo.id}:${photo.src}:${photo.thumbnailSrc}`} photo={photo} />

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close photo details"
            onClick={(event) => onClose(event.detail === 0)}
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition-colors duration-150 hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 sm:right-4 sm:top-4"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[40dvh] min-h-0 shrink-0 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <h4 id={titleId} className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
            {photo.title}
          </h4>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {photo.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function PhotoDetailDialog({
  photo,
  onClose,
  onExitComplete,
  returnFocusRef,
}: PhotoDetailDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const shouldReduceMotion = useReducedMotion()
  const currentPhotoRef = useRef(photo)
  const restoreFocusFrameRef = useRef<number | null>(null)
  const restoreFocusVisibleRef = useRef(false)

  const handleClose = useCallback((restoreFocusVisible: boolean) => {
    restoreFocusVisibleRef.current = restoreFocusVisible
    onClose()
  }, [onClose])

  useEffect(() => {
    currentPhotoRef.current = photo
  }, [photo])

  useEffect(() => () => {
    if (restoreFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrameRef.current)
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        if (currentPhotoRef.current) return

        const finishExit = () => {
          if (currentPhotoRef.current) return

          if (document.getElementById('root')?.inert) {
            restoreFocusFrameRef.current = window.requestAnimationFrame(finishExit)
            return
          }

          restoreFocusFrameRef.current = null
          onExitComplete()
          const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : document.getElementById('photo-gallery')
          target?.focus({
            preventScroll: true,
            focusVisible: restoreFocusVisibleRef.current,
          })
        }

        restoreFocusFrameRef.current = window.requestAnimationFrame(finishExit)
      }}
    >
      {photo && (
        <PhotoDetailDialogContent
          key="photo-detail-dialog"
          photo={photo}
          onClose={handleClose}
          titleId={titleId}
          descriptionId={descriptionId}
          shouldReduceMotion={Boolean(shouldReduceMotion)}
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}
