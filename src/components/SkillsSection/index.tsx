import { useEffect, useState } from 'react'
import IconCloud from '../IconCloud'
import { TextAnimate } from '../TextAnimate'
import {
  skillIconImages,
  skillIconImagesDark,
  skillIconPlaceholders,
} from '@/data/skills'

const learningNote = 'In the age of AI, learning is no longer about remembering every answer. It is about asking better questions, testing what seems convincing, and turning limitless information into understanding, creativity, and choices we can truly call our own.'

function readDarkTheme() {
  const root = document.documentElement
  if (root.classList.contains('dark')) return true
  if (root.classList.contains('light')) return false
  return localStorage.getItem('theme') !== 'light'
}

export default function SkillsSection() {
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
            <IconCloud
              images={isDarkTheme ? skillIconImagesDark : skillIconImages}
              showControl={false}
              autoRotateDuration={5000}
              className="max-w-[440px] sm:max-w-[480px]"
            />
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
              {learningNote}
            </TextAnimate>
          </div>
        </div>

        <div className="sr-only">
          <p>
            The icons are temporary visual placeholders and will be updated to match the actual technology stack.
          </p>
          <ul aria-label="Temporary technology icon list">
            {skillIconPlaceholders.map((icon) => (
              <li key={icon.name}>{icon.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
