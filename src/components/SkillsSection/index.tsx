import { useEffect, useState } from 'react'
import IconCloud from '../IconCloud'
import { TextAnimate } from '../TextAnimate'
import { getSkills } from '@/services/skills'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import { useSiteContent } from '@/hooks/site-content-context'
import QueryContent from '../QueryContent'

function readDarkTheme() {
  const root = document.documentElement
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false
  return localStorage.getItem('theme') !== 'light'
}

export default function SkillsSection() {
  const [isDarkTheme, setIsDarkTheme] = useState(readDarkTheme)
  const skills = usePublicQuery(getSkills)
  const { profile } = useSiteContent()

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
            <QueryContent query={skills} label="skills" isEmpty={items => items.length === 0}>{items => <IconCloud
              images={items.flatMap(skill => {
                const icon = isDarkTheme ? skill.darkIcon ?? skill.icon : skill.icon ?? skill.darkIcon
                return icon ? [icon.url] : []
              })}
              showControl={false}
              autoRotateDuration={5000}
              className="max-w-[440px] sm:max-w-[480px]"
            />}</QueryContent>
          </div>

          <div className="flex justify-center md:justify-start">
            <QueryContent query={profile} label="site profile">{data => <TextAnimate
              as="p"
              animation="blurInUp"
              by="word"
              delay={0.12}
              duration={1.3}
              once
              className="max-w-xl text-pretty text-center text-2xl font-medium leading-[1.45] tracking-tight text-foreground sm:text-3xl md:text-left lg:text-4xl"
            >
              {data.learningNote}
            </TextAnimate>}</QueryContent>
          </div>
        </div>

        <div className="sr-only">
          <ul aria-label="Technology list">
            {skills.status === 'success' && skills.data.map((icon) => (
              <li key={icon.id}>{icon.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
