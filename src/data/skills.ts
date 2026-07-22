interface SkillIconPlaceholder {
  name: string
  image: string
  darkImage?: string
}

export const skillIconPlaceholders: readonly SkillIconPlaceholder[] = [
  { name: 'TypeScript', image: '/images/icons/typescript.svg' },
  { name: 'JavaScript', image: '/images/icons/javascript.svg' },
  {
    name: 'React',
    image: '/images/icons/react-light.svg',
    darkImage: '/images/icons/react-dark.svg',
  },
  { name: 'Vite', image: '/images/icons/vite.svg' },
  { name: 'Node.js', image: '/images/icons/nodejs.svg' },
  { name: 'HTML', image: '/images/icons/html5.svg' },
  { name: 'CSS', image: '/images/icons/css-old.svg' },
  { name: 'Python', image: '/images/icons/python.svg' },
  { name: 'Java', image: '/images/icons/java.svg' },
  { name: 'C', image: '/images/icons/c.svg' },
  { name: 'C++', image: '/images/icons/c-plusplus.svg' },
  { name: 'Vue', image: '/images/icons/vue.svg' },
  {
    name: 'Three.js',
    image: '/images/icons/three-js-light.svg',
    darkImage: '/images/icons/three-js-dark.svg',
  },
  { name: 'Git', image: '/images/icons/git.svg' },
  {
    name: 'GitHub',
    image: '/images/icons/github-light.svg',
    darkImage: '/images/icons/github-dark.svg',
  },
  { name: 'VS Code', image: '/images/icons/vscode.svg' },
  {
    name: 'MySQL',
    image: '/images/icons/mysql-light.svg',
    darkImage: '/images/icons/mysql-dark.svg',
  },
  { name: 'PostgreSQL', image: '/images/icons/postgresql.svg' },
  { name: 'Redis', image: '/images/icons/redis.svg' },
  {
    name: 'Markdown',
    image: '/images/icons/markdown-light.svg',
    darkImage: '/images/icons/markdown-dark.svg',
  },
  { name: 'Ant Design', image: '/images/icons/ant-design-dark-theme.svg' },
  {
    name: 'Codex',
    image: '/images/icons/codex-light.svg',
    darkImage: '/images/icons/codex-dark.svg',
  },
  { name: 'Claude', image: '/images/icons/claude-ai.svg' },
  { name: 'Chrome', image: '/images/icons/chrome.svg' },
]

export const skillIconImages = skillIconPlaceholders.map((icon) => icon.image)
export const skillIconImagesDark = skillIconPlaceholders.map(
  (icon) => icon.darkImage ?? icon.image,
)
