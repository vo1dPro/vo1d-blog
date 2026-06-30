import type { SkillCategory } from '@/types'

export const skillCategories: SkillCategory[] = [
  {
    title: 'Frontend',
    skills: [
      { name: 'Vue 3' },
      { name: 'React' },
      { name: 'TypeScript' },
      { name: 'JavaScript' },
      { name: 'HTML / CSS' },
      { name: 'Tailwind CSS' },
      { name: 'Vite' },
    ],
  },
  {
    title: 'Backend',
    skills: [
      { name: 'Node.js' },
      { name: 'Express' },
      { name: 'Python' },
      { name: 'REST API' },
    ],
  },
  {
    title: 'Database',
    skills: [
      { name: 'MySQL' },
      { name: 'MongoDB' },
      { name: 'Redis' },
    ],
  },
  {
    title: 'Tools',
    skills: [
      { name: 'Git' },
      { name: 'Docker' },
      { name: 'VS Code' },
      { name: 'Figma' },
    ],
  },
  {
    title: 'AI Coding',
    skills: [
      { name: 'Claude' },
      { name: 'Cursor' },
      { name: 'GitHub Copilot' },
    ],
  },
]
