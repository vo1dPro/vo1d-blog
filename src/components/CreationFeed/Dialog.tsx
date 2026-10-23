import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Creation } from '@/services/creations/model'
import { CreationContent, CreationActions } from './Card'

// Shared layout follows Motion Primitives' Morphing Dialog pattern.
// Keep the native modal for top-layer rendering, inert background and Escape.
export default function CreationDialog({ post, trigger, onClosed }: {
  post: Creation
  trigger: HTMLButtonElement
  onClosed: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(true)
  const reducedMotion = useReducedMotion()
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 320, damping: 34 }

  function close() {
    dialogRef.current?.querySelectorAll('video').forEach(video => video.pause())
    setIsOpen(false)
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const body = document.body
    const root = document.documentElement
    const old = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const oldRootOverflow = root.style.overflow
    const oldLock = root.getAttribute('data-page-scroll-locked')
    const gap = window.innerWidth - document.documentElement.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    // Keep the document in normal flow: fixing body resets scrollY and invalidates
    // both Motion's shared-layout measurements and the smooth-scroll position.
    root.setAttribute('data-page-scroll-locked', '')
    window.dispatchEvent(new Event('page-scroll-lock-change'))
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${padding + gap}px`
    // `open` makes the first layout measurement available before promotion.
    dialog.removeAttribute('open')
    dialog.showModal()
    contentRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      Object.assign(body.style, old)
      root.style.overflow = oldRootOverflow
      if (oldLock === null) root.removeAttribute('data-page-scroll-locked')
      else root.setAttribute('data-page-scroll-locked', oldLock)
      window.dispatchEvent(new Event('page-scroll-lock-change'))
      // Let the feed remeasure its clipped/inert cards after the modal exits.
      requestAnimationFrame(() => {
        if (dialog.isConnected || !trigger.isConnected) return
        const target = trigger.closest('[inert]')
          ? trigger.closest('.creation-feed-window')?.querySelector<HTMLButtonElement>('.creation-feed-more')
          : trigger
        target?.focus({ preventScroll: true })
      })
    }
  }, [trigger])

  return createPortal(<motion.dialog open layoutRoot ref={dialogRef} className="creation-dialog" aria-label={`${post.author.name} 的动态`} data-lenis-prevent
    data-state={isOpen ? 'open' : 'closing'}
    onKeyDown={event => {
      if (event.key !== 'Tab') return
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], video[controls], [tabindex="0"]',
      )).filter(element => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }}
    onCancel={event => { event.preventDefault(); close() }}>
    <AnimatePresence onExitComplete={onClosed}>
      {isOpen && <motion.div key="scrim" className="creation-scrim" aria-hidden="true" onClick={close}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22 }} />}
      {isOpen && <motion.div key="panel" className="creation-window"
        layoutId={reducedMotion ? undefined : `creation-${post.platform}:${post.id}`}
        style={{ borderRadius: 18 }} transition={transition}>
        <motion.div layout="position" layoutScroll ref={contentRef} className="creation-window-scroll" data-lenis-prevent tabIndex={0} role="region" aria-label="动态内容">
          <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, delay: reducedMotion ? 0 : 0.06 }}>
            <CreationContent post={post} expanded />
          </motion.div>
          <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}>
            <CreationActions post={post} />
          </motion.div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </motion.dialog>, document.body)
}
