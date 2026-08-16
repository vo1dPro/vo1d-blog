import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function SmoothScroll() {
  useEffect(() => {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | null = null
    let ticker: ((time: number) => void) | null = null

    const destroyLenis = () => {
      if (ticker) {
        gsap.ticker.remove(ticker)
        ticker = null
      }
      lenis?.destroy()
      lenis = null
    }

    const setupLenis = () => {
      destroyLenis()
      if (reduceMotionQuery.matches) return

      lenis = new Lenis({
        autoRaf: false,
        anchors: true,
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      })
      lenis.on('scroll', ScrollTrigger.update)

      ticker = (time: number) => {
        lenis?.raf(time * 1000)
      }
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)
    }

    const refreshScrollTriggers = () => ScrollTrigger.refresh()

    setupLenis()
    reduceMotionQuery.addEventListener('change', setupLenis)
    window.addEventListener('load', refreshScrollTriggers, { once: true })

    return () => {
      reduceMotionQuery.removeEventListener('change', setupLenis)
      window.removeEventListener('load', refreshScrollTriggers)
      destroyLenis()
    }
  }, [])

  return null
}
