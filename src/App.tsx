import { useEffect, useState } from 'react'
import { SmoothCursor } from './components/SmoothCursor'
import { AnimatedThemeToggler } from './components/AnimatedThemeToggler'
import AppFooter from './components/AppFooter'
import HeroSection from './components/HeroSection'
import SkillsSection from './components/SkillsSection'
import BlogSection from './components/BlogSection'
import ArticleRoute from './components/ArticleRoute'
import HobbiesSection from './components/HobbiesSection'
import StaggeredMenu from './components/StaggeredMenu'
import { SmoothScroll } from './components/SmoothScroll'
import { useSiteContent } from './hooks/site-content-context'
import QueryContent from './components/QueryContent'

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/#home' },
  { label: 'Skills', ariaLabel: 'View my skills', link: '/#skills' },
  { label: 'Blog', ariaLabel: 'Read my blog', link: '/#blog' },
  { label: 'Hobbies', ariaLabel: 'My hobbies', link: '/#hobbies' },
  { label: 'Footer', ariaLabel: 'Go to site footer', link: '/#footer' },
]

function App() {
  const { socials } = useSiteContent()
  const socialItems = socials.status === 'success' ? socials.data.map(social => ({
    label: social.name, link: social.url, icon: social.icon?.url ?? null, darkIcon: social.darkIcon?.url ?? null,
  })) : []
  const [pathname, setPathname] = useState(() => window.location.pathname)
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
        socialStatus={<QueryContent query={socials} label="social links">{() => null}</QueryContent>}
        displaySocials
        displayItemNumbering={false}
        colors={['#1c1c1e', '#2c2c2e']}
        accentColor="var(--primary, #0a84ff)"
        menuButtonColor="#ffffff"
        openMenuButtonColor="var(--card-foreground)"
        changeMenuColorOnOpen
      />

      {isBlogPath ? (
        <>
          <div className="page-shell">
            <ArticleRoute pathname={pathname} />
          </div>
          <AppFooter />
        </>
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
