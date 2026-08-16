import { useEffect, useState } from 'react'
import { SmoothCursor } from './components/SmoothCursor'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import AppFooter from './components/AppFooter'
import HeroSection from './components/HeroSection'
import SkillsSection from './components/SkillsSection'
import BlogSection from './components/BlogSection'
import BlogPostPage from './components/BlogPostPage'
import HobbiesSection from './components/HobbiesSection'
import StaggeredMenu from './components/StaggeredMenu'
import { SmoothScroll } from './components/SmoothScroll'
import { socials } from './data/socials'
import { getArticleFromPath } from './lib/blog'

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/#home' },
  { label: 'Skills', ariaLabel: 'View my skills', link: '/#skills' },
  { label: 'Blog', ariaLabel: 'Read my blog', link: '/#blog' },
  { label: 'Hobbies', ariaLabel: 'My hobbies', link: '/#hobbies' },
]

const socialItems = socials.map((social) => ({
  label: social.name,
  link: social.url,
  icon: social.icon,
}))

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const article = getArticleFromPath(pathname)
  const isBlogPath = pathname.startsWith('/blog/')

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <div className="relative isolate min-h-screen bg-background cursor-none">
      <SmoothScroll />
      <SmoothCursor />

      <div className="theme-toggle-shell fixed top-5 left-5 z-[60]">
        <AnimatedThemeToggler className="!text-white hover:!bg-white/10" />
      </div>

      <StaggeredMenu
        className="site-menu-shell"
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering={false}
        colors={['#1c1c1e', '#2c2c2e']}
        accentColor="var(--primary, #0a84ff)"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen
      />

      {article ? (
        <>
          <div className="page-shell">
            <BlogPostPage article={article} />
          </div>
          <AppFooter />
        </>
      ) : isBlogPath ? (
        <main className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground">404</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">Article not found</h1>
            <a
              href="/#blog"
              className="mt-6 inline-flex rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
            >
              Back to blog
            </a>
          </div>
        </main>
      ) : (
        <>
          <main className="page-shell">
            <HeroSection />
            <SkillsSection />
            <BlogSection />
            <HobbiesSection />
          </main>
          <AppFooter />
        </>
      )}
    </div>
  )
}

export default App
