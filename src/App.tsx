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
import {
  usePublicCollection,
  usePublicResource,
  type PublicSocial,
  type PublicSiteProfile,
  type PublicArticleDetail,
} from './lib/public-content'
import { SiteProfileContext } from './lib/site-profile'
import { ContentStatus } from './components/ContentStatus'
import { getArticleFromPath } from './lib/blog'

const menuItems = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/#home' },
  { label: 'Skills', ariaLabel: 'View my skills', link: '/#skills' },
  { label: 'Blog', ariaLabel: 'Read my blog', link: '/#blog' },
  { label: 'Hobbies', ariaLabel: 'My hobbies', link: '/#hobbies' },
  { label: 'Footer', ariaLabel: 'Go to site footer', link: '/#footer' },
]

function App() {
  const profile = usePublicResource<PublicSiteProfile>('site-profile')
  const socialContent = usePublicCollection<PublicSocial>('social-links')
  const socialItems = (socialContent.data ?? []).map((social) => ({
    label: social.name,
    link: social.url,
    icon: social.iconKey,
    iconUrl: social.icon?.url,
    darkIconUrl: social.darkIcon?.url,
  }))
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const articleKey = getArticleFromPath(pathname)
  const articleContent = usePublicResource<PublicArticleDetail>(
    articleKey ? `articles/${encodeURIComponent(articleKey)}` : null,
  )
  const article = articleContent.data
  const isBlogPath = pathname.startsWith('/blog/')

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <SiteProfileContext value={profile.data}>
      <div className="relative isolate min-h-screen bg-background cursor-none">
        <div className="relative z-10 px-6 pt-16" hidden={profile.data !== null && !profile.error}>
          <ContentStatus
            error={profile.error}
            loading={profile.data === null}
            empty={false}
            retry={profile.retry}
          />
        </div>
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
          openMenuButtonColor="var(--card-foreground)"
          changeMenuColorOnOpen
        />

        {article ? (
          <>
            <div className="page-shell">
              <ContentStatus
                error={articleContent.error}
                loading={false}
                empty={false}
                retry={articleContent.retry}
              />
              <BlogPostPage key={article.id} article={article} />
            </div>
            <AppFooter />
          </>
        ) : isBlogPath ? (
          <main className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
            <div>
              {!articleKey || articleContent.status === 404 ? (
                <>
                  <p className="text-sm text-muted-foreground">404</p>
                  <h1 className="mt-2 text-3xl font-semibold text-foreground">Article not found</h1>
                </>
              ) : (
                <ContentStatus
                  error={articleContent.error}
                  loading={articleContent.data === null}
                  empty={false}
                  retry={articleContent.retry}
                />
              )}
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
    </SiteProfileContext>
  )
}

export default App
