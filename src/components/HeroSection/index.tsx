import { ArrowDown, Sparkles } from 'lucide-react'

export default function HeroSection() {
  function scrollToAbout() {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToBlog() {
    document.querySelector('#blog')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Avatar placeholder */}
        <div
          className="mx-auto mb-8 w-28 h-28 rounded-full bg-foreground/5 backdrop-blur-xl border border-foreground/10 dark:bg-white/[0.08] dark:border-white/[0.12] flex items-center justify-center shadow-lg shadow-black/20"
        >
          <Sparkles size={40} className="text-muted-foreground" />
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-tight"
        >
          Hi, I'm{' '}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            vo1d
          </span>
        </h1>

        <p className="mt-6 text-xl md:text-2xl text-muted-foreground leading-relaxed">
          A developer who loves building things with code,<br className="hidden md:block" />
          exploring new technologies, and sharing what I learn.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#blog"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground/10 backdrop-blur-xl text-foreground dark:bg-white/[0.12] dark:text-white rounded-full text-sm font-medium border dark:border-white/[0.15] border-foreground/10 hover:bg-white/[0.18] transition-all duration-300 shadow-lg shadow-black/10"
            onClick={(e) => { e.preventDefault(); scrollToBlog() }}
          >
            Read Blog
          </a>
          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground/5 backdrop-blur-xl text-foreground dark:bg-white/[0.05] dark:text-white rounded-full text-sm font-medium border dark:border-white/[0.1] border-foreground/10 hover:bg-white/[0.1] hover:border-white/[0.18] transition-all duration-300"
            onClick={(e) => { e.preventDefault(); scrollToAbout() }}
          >
            Learn More
          </a>
        </div>

        {/* Scroll indicator */}
        <button
          className="mt-16 animate-bounce text-muted-foreground hover:text-foreground transition-colors"
          onClick={scrollToAbout}
          aria-label="Scroll down"
        >
          <ArrowDown size={24} />
        </button>
      </div>
    </section>
  )
}
