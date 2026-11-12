import { useEffect, useState } from 'react'
import Vo1dLogo from '../Vo1dLogo'

/** Small wordmark beside the theme toggle; on the home page it appears once the hero is left behind. */
export default function CornerLogo({ home }: { home: boolean }) {
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    if (!home) return
    const sync = () => setPastHero(window.scrollY > window.innerHeight * 0.7)
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [home])

  const visible = !home || pastHero

  return (
    <a
      href="/"
      aria-label="VO1D, back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`hidden p-2 text-white sm:block transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${visible ? 'opacity-100' : 'pointer-events-none -translate-x-2 opacity-0'}`}
      onClick={(event) => {
        if (!home) return
        event.preventDefault()
        document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' })
      }}
    >
      <Vo1dLogo className="block h-3.5 w-auto" />
    </a>
  )
}
