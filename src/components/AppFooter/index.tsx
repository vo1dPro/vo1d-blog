import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { SocialIconLink } from '@/components/SocialIconLink'
import { AsciiArt } from '@/components/ui/ascii-art'
import { socials } from '@/data/socials'
import './index.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const controlsInvertedClass = 'footer-controls-inverted'

export default function AppFooter() {
  const trackRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const leftHandRef = useRef<HTMLDivElement>(null)
  const rightHandRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLParagraphElement>(null)
  const theRef = useRef<HTMLSpanElement>(null)
  const endRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    const footer = footerRef.current
    if (!track || !footer) return

    let cancelled = false
    let context: gsap.Context | null = null
    let removePointerListeners: (() => void) | null = null

    const setControlsTheme = () => {
      const switchLine = Math.min(80, window.innerHeight * 0.1)
      const shouldInvert = track.getBoundingClientRect().top <= switchLine
      document.documentElement.classList.toggle(
        controlsInvertedClass,
        shouldInvert,
      )
    }

    const setupAnimations = () => {
      if (cancelled) return

      context = gsap.context(() => {
        const leftHand = leftHandRef.current
        const rightHand = rightHandRef.current
        const intro = introRef.current
        const the = theRef.current
        const end = endRef.current
        const dot = dotRef.current
        if (!leftHand || !rightHand || !intro || !the || !end || !dot) {
          return
        }

        const introSplit = SplitText.create(intro, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'animated-footer__intro-line',
          aria: 'auto',
        })
        const theSplit = SplitText.create(the, {
          type: 'chars',
          charsClass: 'animated-footer__title-char',
          aria: 'auto',
        })
        const endSplit = SplitText.create(end, {
          type: 'chars',
          charsClass: 'animated-footer__title-char',
          aria: 'auto',
        })

        const leftTitleCharacters = [...theSplit.chars].reverse()
        const rightTitleCharacters = [...endSplit.chars]
        const studioItems = introSplit.lines as HTMLElement[]
        const footerSocialIcons = gsap.utils.toArray<HTMLElement>(
          '[data-footer-social-icon]',
          footer,
        )
        const reduceMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches

        ScrollTrigger.create({
          trigger: track,
          start: 'top bottom',
          end: 'bottom bottom',
          onRefresh: setControlsTheme,
          onUpdate: setControlsTheme,
        })

        if (reduceMotion) {
          gsap.set(
            [
              leftHand,
              rightHand,
              leftTitleCharacters,
              rightTitleCharacters,
              dot,
              footerSocialIcons,
              studioItems,
            ],
            { clearProps: 'all' },
          )
          setControlsTheme()
          return
        }

        gsap.set(leftHand, { xPercent: -82 })
        gsap.set(rightHand, { xPercent: 82 })
        gsap.set([...leftTitleCharacters, ...rightTitleCharacters], {
          yPercent: 145,
        })
        gsap.set(dot, { scale: 0, autoAlpha: 0 })
        gsap.set(footerSocialIcons, { autoAlpha: 0, yPercent: 70, scale: 0.8 })
        gsap.set(studioItems, {
          clipPath: 'inset(0 100% 0 0)',
          yPercent: 16,
        })

        const revealTimeline = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: track,
            start: 'top 34%',
            end: 'bottom bottom',
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        })

        revealTimeline
          .to(
            leftHand,
            { xPercent: 0, duration: 1.22 },
            0,
          )
          .to(
            rightHand,
            { xPercent: 0, duration: 1.22 },
            0,
          )
          .to(
            leftTitleCharacters,
            {
              yPercent: 0,
              duration: 0.28,
              stagger: { each: 0.11, from: 'start' },
            },
            0.16,
          )
          .to(
            rightTitleCharacters,
            {
              yPercent: 0,
              duration: 0.28,
              stagger: { each: 0.11, from: 'start' },
            },
            0.16,
          )
          .to(
            dot,
            {
              scale: 1,
              autoAlpha: 1,
              duration: 0.14,
              ease: 'back.out(1.7)',
            },
            0.58,
          )
          .to(
            footerSocialIcons,
            {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: 0.2,
              stagger: { each: 0.07, from: 'center' },
              ease: 'back.out(1.6)',
            },
            0.52,
          )

        const addLineReveal = (
          targets: HTMLElement[],
          position: number,
          stagger: number,
        ) => {
          if (targets.length === 0) return

          revealTimeline.to(
            targets,
            {
              clipPath: 'inset(0 0% 0 0)',
              yPercent: 0,
              duration: 0.3,
              stagger: { each: stagger, from: 'start' },
            },
            position,
          )
        }

        addLineReveal(studioItems, 0.72, 0.075)

        const leftX = gsap.quickTo(leftHand, 'x', {
          duration: 0.8,
          ease: 'power3.out',
        })
        const leftY = gsap.quickTo(leftHand, 'y', {
          duration: 0.8,
          ease: 'power3.out',
        })
        const rightX = gsap.quickTo(rightHand, 'x', {
          duration: 0.9,
          ease: 'power3.out',
        })
        const rightY = gsap.quickTo(rightHand, 'y', {
          duration: 0.9,
          ease: 'power3.out',
        })

        const handlePointerMove = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return
          const bounds = footer.getBoundingClientRect()
          const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5
          const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5

          leftX(normalizedX * 24)
          leftY(normalizedY * 16)
          rightX(normalizedX * -22)
          rightY(normalizedY * -14)
        }

        const handlePointerLeave = () => {
          leftX(0)
          leftY(0)
          rightX(0)
          rightY(0)
        }

        footer.addEventListener('pointermove', handlePointerMove)
        footer.addEventListener('pointerleave', handlePointerLeave)
        removePointerListeners = () => {
          footer.removeEventListener('pointermove', handlePointerMove)
          footer.removeEventListener('pointerleave', handlePointerLeave)
        }
      }, footer)

      setControlsTheme()
      ScrollTrigger.refresh()
    }

    if (document.fonts?.ready) {
      void document.fonts.ready.then(setupAnimations)
    } else {
      setupAnimations()
    }

    return () => {
      cancelled = true
      removePointerListeners?.()
      context?.revert()
      document.documentElement.classList.remove(controlsInvertedClass)
    }
  }, [])

  return (
    <section ref={trackRef} className="animated-footer-track">
      <span
        id="footer"
        className="animated-footer__anchor"
        aria-hidden="true"
      />
      <footer
        ref={footerRef}
        className="animated-footer"
        aria-label="Site footer"
      >
        <div className="animated-footer__top">
          <div className="animated-footer__studio">
            <p ref={introRef} className="animated-footer__intro">
              Thanks for visiting.
            </p>
          </div>
        </div>

        <div className="animated-footer__hands">
          <div
            ref={leftHandRef}
            className="animated-footer__hand animated-footer__hand--left"
          >
            <AsciiArt
              src="/images/footer/left-hand.png"
              resolution={82}
              charset="dense"
              cellAspectRatio={1}
              color="var(--footer-hand)"
              backgroundColor="transparent"
              animated={false}
              objectFit="contain"
              trimTransparent
              interactive
              interactionColor="var(--footer-accent)"
              interactionTextColor="var(--footer-bg)"
              interactionRadius={60}
              ariaLabel="ASCII illustration of a hand reaching from the left"
              className="animated-footer__ascii"
            />
          </div>

          <div
            ref={rightHandRef}
            className="animated-footer__hand animated-footer__hand--right"
          >
            <AsciiArt
              src="/images/footer/right-hand.png"
              resolution={82}
              charset="dense"
              cellAspectRatio={1}
              color="var(--footer-hand)"
              backgroundColor="transparent"
              animated={false}
              objectFit="contain"
              trimTransparent
              interactive
              interactionColor="var(--footer-accent)"
              interactionTextColor="var(--footer-bg)"
              interactionRadius={60}
              ariaLabel="ASCII illustration of a hand reaching from the right"
              className="animated-footer__ascii"
            />
          </div>
        </div>

        <div className="animated-footer__title" aria-label="The End">
          <span
            ref={theRef}
            className="animated-footer__title-word animated-footer__title-word--the"
          >
            The
          </span>
          <nav className="animated-footer__socials" aria-label="Footer social links">
            {socials.map((social) => (
              <span key={social.name} data-footer-social-icon>
                <SocialIconLink
                  name={social.name}
                  href={social.url}
                  icon={social.icon}
                  className="animated-footer__social-link"
                />
              </span>
            ))}
          </nav>
          <span className="animated-footer__title-end-group">
            <span
              ref={endRef}
              className="animated-footer__title-word animated-footer__title-word--end"
            >
              End
            </span>
            <span
              ref={dotRef}
              className="animated-footer__title-dot"
              aria-hidden="true"
            />
          </span>
        </div>
      </footer>
    </section>
  )
}
