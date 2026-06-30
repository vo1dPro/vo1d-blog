import { useState } from 'react'
import type { CSSProperties } from 'react'
import { skillCategories } from '@/data/skills'
import SectionTitle from '../SectionTitle'

interface StackProfile {
  accent: string
  artifact: string
  label: string
  note: string
  rhythm: string
  title: string
}

const stackProfiles: Record<string, StackProfile> = {
  Frontend: {
    accent: '#3db7d6',
    artifact: 'interfaces, motion, responsive systems',
    label: 'surface',
    note: 'Where product intent becomes touchable: structured components, careful state, and visual polish that survives real layouts.',
    rhythm: 'compose / refine / ship',
    title: 'Interface Craft',
  },
  Backend: {
    accent: '#7fbf8d',
    artifact: 'routes, services, data contracts',
    label: 'runtime',
    note: 'The service layer stays small, readable, and predictable so the front end has a clean system to lean on.',
    rhythm: 'model / expose / protect',
    title: 'Service Logic',
  },
  Database: {
    accent: '#d7ac55',
    artifact: 'records, documents, cache paths',
    label: 'memory',
    note: 'Data choices are treated as product decisions: what should be durable, what should be fast, and what should stay simple.',
    rhythm: 'shape / query / persist',
    title: 'Data Shape',
  },
  Tools: {
    accent: '#9f91d9',
    artifact: 'design handoff, containers, editor flow',
    label: 'workflow',
    note: 'The toolchain is selected for short feedback loops: inspect quickly, change deliberately, and keep the build portable.',
    rhythm: 'inspect / adjust / deliver',
    title: 'Working Loop',
  },
  'AI Coding': {
    accent: '#d987ad',
    artifact: 'review, exploration, assisted iteration',
    label: 'amplifier',
    note: 'AI sits beside the process as a second pass for reasoning, edge cases, alternatives, and momentum.',
    rhythm: 'probe / compare / decide',
    title: 'AI Pairing',
  },
}

const skillRoles: Record<string, string> = {
  'Vue 3': 'reactivity',
  React: 'composition',
  TypeScript: 'contracts',
  JavaScript: 'runtime',
  'HTML / CSS': 'layout',
  'Tailwind CSS': 'styling',
  Vite: 'build',
  'Node.js': 'server',
  Express: 'routing',
  Python: 'automation',
  'REST API': 'interface',
  MySQL: 'relations',
  MongoDB: 'documents',
  Redis: 'cache',
  Git: 'history',
  Docker: 'runtime',
  'VS Code': 'editing',
  Figma: 'handoff',
  Claude: 'reasoning',
  Cursor: 'editor',
  'GitHub Copilot': 'completion',
}

export default function SkillsSection() {
  const [activeTitle, setActiveTitle] = useState(skillCategories[0]?.title ?? 'Frontend')
  const activeIndex = Math.max(
    0,
    skillCategories.findIndex((category) => category.title === activeTitle),
  )
  const activeCategory = skillCategories[activeIndex] ?? skillCategories[0]
  const activeProfile = stackProfiles[activeCategory.title]

  return (
    <section id="skills" className="skills-section py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle title="Skills" subtitle="Technologies and tools I work with" />

        <div
          className="skill-atlas"
          style={
            {
              '--atlas-accent': activeProfile.accent,
              '--atlas-index': activeIndex,
            } as CSSProperties
          }
        >
          <div className="skill-atlas__grain" />

          <div className="skill-atlas__mast">
            <p>Stack Atlas</p>
            <h3>A practical map of the tools I use to turn ideas into shipped interfaces.</h3>
          </div>

          <div className="skill-atlas__layout">
            <nav className="skill-atlas__index" aria-label="Skill layers">
              <span className="skill-atlas__indicator" />
              {skillCategories.map((category, index) => {
                const profile = stackProfiles[category.title]
                const isActive = category.title === activeCategory.title

                return (
                  <button
                    key={category.title}
                    type="button"
                    className={`skill-atlas__index-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => setActiveTitle(category.title)}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{profile.title}</strong>
                    <small>{profile.label}</small>
                  </button>
                )
              })}
            </nav>

            <article className="skill-atlas__sheet" key={activeCategory.title}>
              <div className="skill-atlas__sheet-head">
                <div>
                  <p>{activeProfile.label}</p>
                  <h4>{activeProfile.title}</h4>
                </div>
                <span>{activeProfile.rhythm}</span>
              </div>

              <p className="skill-atlas__note">{activeProfile.note}</p>

              <div className="skill-atlas__artifact">
                <span>output</span>
                <strong>{activeProfile.artifact}</strong>
              </div>

              <div className="skill-atlas__materials" aria-label={`${activeCategory.title} skills`}>
                {activeCategory.skills.map((skill, index) => (
                  <div
                    key={skill.name}
                    className="skill-atlas__material"
                    style={{ '--material-index': index } as CSSProperties}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{skill.name}</strong>
                    <small>{skillRoles[skill.name] ?? 'tooling'}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
