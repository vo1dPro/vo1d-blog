import { useRef, type CSSProperties } from 'react'
import { useSiteContent } from '@/hooks/site-content-context'
import { usePixelField } from '@/hooks/usePixelField'
import QueryContent from '../QueryContent'
import './index.css'

export default function HeroSection() {
  const { profile } = useSiteContent()
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const phase = usePixelField({ text: 'VO1D', sectionRef, canvasRef, anchorRef: logoRef })

  function scrollTo(selector: string) {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} id="home" className="hero" data-ready={phase !== 'idle'} data-assembled={phase === 'assembled'}>
      <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />

      <div className="hero__inner">
        <div ref={logoRef} className="hero__logo" aria-hidden="true" />

        <div className="hero__copy">
          <QueryContent query={profile} label="site profile">{data => <>
            <h1 className="sr-only">{data.heroTitlePrefix} {data.displayName}</h1>
            <p className="hero__meta hero__reveal" style={{ '--hero-delay': '1.05s' } as CSSProperties}>
              {data.avatar && <img src={data.avatar.url} alt="" className="hero__avatar" />}
              <span>{data.displayName}</span>
              <span className="hero__meta-divider" aria-hidden="true" />
              <span>{data.role}</span>
            </p>
            <p className="hero__description hero__reveal" style={{ '--hero-delay': '1.2s' } as CSSProperties}>
              {data.heroDescription}
            </p>
          </>}</QueryContent>
        </div>

        <div className="hero__actions hero__reveal" style={{ '--hero-delay': '1.35s' } as CSSProperties}>
          <a
            href="#blog"
            className="hero__button hero__button--solid"
            onClick={(event) => { event.preventDefault(); scrollTo('#blog') }}
          >
            Read Blog
          </a>
          <a
            href="#skills"
            className="hero__button"
            onClick={(event) => { event.preventDefault(); scrollTo('#skills') }}
          >
            Explore Skills
          </a>
        </div>
      </div>

    </section>
  )
}
