import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import type { Creation } from '@/services/creations/model'
import { CreationContent, CreationActions } from './Card'

export default function CreationDialog({ post, trigger, onClosed }: {
  post: Creation
  trigger: HTMLButtonElement
  onClosed: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const requestClose = useRef<() => void>(() => {})

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const panel = panelRef.current
    if (!dialog || !panel) return
    const body = document.body
    const scrollY = window.scrollY
    const old = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight }
    const gap = window.innerWidth - document.documentElement.clientWidth
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0
    const origin = trigger.getBoundingClientRect()
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let closing = false
    let disposed = false
    dialog.showModal()
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${padding + gap}px`
    contentRef.current?.focus({ preventScroll: true })
    const destination = panel.getBoundingClientRect()
    const start = {
      x: origin.left + origin.width / 2 - destination.left - destination.width / 2,
      y: origin.top + origin.height / 2 - destination.top - destination.height / 2,
      scaleX: origin.width / destination.width,
      scaleY: Math.min(1, origin.height / destination.height),
    }
    const context = gsap.context(() => {
      gsap.fromTo(panel, { ...start, opacity: 0 }, {
        x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1,
        duration: reduced.matches ? 0 : 0.46, ease: 'power3.out',
        onComplete: () => { dialog.dataset.state = 'open' },
      })
      gsap.fromTo('.creation-scrim', { opacity: 0 }, { opacity: 1, duration: reduced.matches ? 0 : 0.25 })
    }, dialog)
    dialog.dataset.state = reduced.matches ? 'open' : 'opening'
    const finish = () => { if (!disposed) onClosed() }
    context.add('close', () => {
      if (closing) return
      closing = true
      dialog.dataset.state = 'closing'
      panel.querySelectorAll('video').forEach(video => video.pause())
      gsap.killTweensOf(panel)
      const target = trigger.getBoundingClientRect()
      gsap.to(panel, {
        x: target.left + target.width / 2 - destination.left - destination.width / 2,
        y: target.top + target.height / 2 - destination.top - destination.height / 2,
        scaleX: target.width / destination.width, scaleY: Math.min(1, target.height / destination.height),
        opacity: 0, duration: reduced.matches ? 0 : 0.26, ease: 'power2.in', onComplete: finish,
      })
      gsap.to('.creation-scrim', { opacity: 0, duration: reduced.matches ? 0 : 0.22 })
    })
    requestClose.current = () => { context.close() }
    const motionChanged = () => {
      if (!reduced.matches) return
      gsap.killTweensOf(panel)
      if (closing) finish()
      else {
        gsap.set(panel, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 })
        dialog.dataset.state = 'open'
      }
    }
    reduced.addEventListener('change', motionChanged)
    return () => {
      disposed = true
      requestClose.current = () => {}
      context.revert()
      reduced.removeEventListener('change', motionChanged)
      dialog.close()
      Object.assign(body.style, old)
      window.scrollTo({ top: scrollY, behavior: 'instant' })
      if (trigger.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [post.id, trigger, onClosed])

  return createPortal(<dialog ref={dialogRef} className="creation-dialog" aria-label={`${post.author.name} 的动态`} data-lenis-prevent
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
    onCancel={event => { event.preventDefault(); requestClose.current() }}>
    <div className="creation-scrim" aria-hidden="true" onClick={() => requestClose.current()} />
    <div className="creation-window" ref={panelRef}>
      <div ref={contentRef} className="creation-window-scroll" data-lenis-prevent tabIndex={0} role="region" aria-label="动态内容">
        <CreationContent post={post} expanded />
        <CreationActions post={post} />
      </div>
    </div>
  </dialog>, document.body)
}
