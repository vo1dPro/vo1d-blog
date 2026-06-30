import { useEffect, useState } from 'react'
import { SmoothCursor } from './components/SmoothCursor'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import AppFooter from './components/AppFooter'
import HeroSection from './components/HeroSection'
import BlogSection from './components/BlogSection'
import BlogPostPage from './components/BlogPostPage'
import HobbiesSection from './components/HobbiesSection'
import StaggeredMenu from './components/StaggeredMenu'
import { socials } from './data/socials'
import { getArticleFromPath } from './lib/blog'

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/#home' },
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
    <div className="min-h-screen bg-background relative cursor-none">
      <SmoothCursor />

      <div className="fixed top-5 left-5 z-[60]">
        <AnimatedThemeToggler />
      </div>

      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering={false}
        colors={['#1c1c1e', '#2c2c2e']}
        accentColor="var(--primary, #0a84ff)"
        menuButtonColor="var(--foreground, #fff)"
        openMenuButtonColor="var(--foreground, #fff)"
        changeMenuColorOnOpen
      />

      {article ? (
        <>
          <BlogPostPage article={article} />
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
          <main className="relative z-10">
            <HeroSection />
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
