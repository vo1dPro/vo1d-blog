import { useEffect, useState } from 'react'
import IconCloud from '../IconCloud'
import { TextAnimate } from '../TextAnimate'
import { usePublicCollection, type PublicSkill } from '@/lib/public-content'
import { ContentStatus } from '../ContentStatus'
import { useSiteProfile } from '@/lib/site-profile'

function readDarkTheme() {
  const root = document.documentElement
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false
  return localStorage.getItem('theme') !== 'light'
}

export default function SkillsSection() {
  const profile = useSiteProfile()
  const content = usePublicCollection<PublicSkill>('skills')
  const skills = content.data ?? []
  const [isDarkTheme, setIsDarkTheme] = useState(readDarkTheme)

  useEffect(() => {
    const root = document.documentElement
    const syncTheme = () => setIsDarkTheme(readDarkTheme())
    const observer = new MutationObserver(syncTheme)

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    })
    syncTheme()

    return () => observer.disconnect()
  }, [])

  return (
    <section id="skills" className="relative scroll-mt-8 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div className="flex justify-center">
            <ContentStatus error={content.error} loading={content.data === null} empty={content.data?.length === 0} retry={content.retry} />
            {skills.some((skill) => skill.icon || skill.darkIcon) && <IconCloud
              images={skills.flatMap((skill) => { const url = (isDarkTheme ? skill.darkIcon ?? skill.icon : skill.icon ?? skill.darkIcon)?.url; return url ? [url] : [] })}
              showControl={false}
              autoRotateDuration={5000}
              className="max-w-[440px] sm:max-w-[480px]"
            />}
          </div>

          <div className="flex justify-center md:justify-start">
            <TextAnimate
              as="p"
              animation="blurInUp"
              by="word"
              delay={0.12}
              duration={1.3}
              once
              className="max-w-xl text-pretty text-center text-2xl font-medium leading-[1.45] tracking-tight text-foreground sm:text-3xl md:text-left lg:text-4xl"
            >
              {profile?.learningNote ?? ''}
            </TextAnimate>
          </div>
        </div>

        <div className="sr-only">
          <p>
            Current technology stack.
          </p>
          <ul aria-label="Technology icon list">
            {skills.map((icon) => (
              <li key={icon.name}>{icon.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
