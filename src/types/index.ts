export interface Article {
  id: number
  title: string
  category: string
  date: string
  tags: string[]
  summary: string
  content: string[]
}

export interface ArticleCategory {
  key: string
  label: string
  icon: string
}

export interface Book {
  id: number
  title: string
  author: string
  cover: string
  accent: string
  sourceName: string | null
  sourceUrl: string | null
  readingOrder: number
  sortOrder?: number
  readingTime: string | null
  startedAt?: string | null
  finishedAt?: string | null
  progress: number
}

export interface Game {
  id: number
  title: string
  platform?: string
  cover: string
  rating: number
  steamStale?: boolean
  steamIncomplete?: boolean
  playtimeHours: number
  likeLevel: number
  comment: string
}

export interface Photo {
  id: number
  src: string
  thumbnailSrc: string
  alt: string
  title: string
  description: string
}

export interface Social {
  name: string
  url: string
  icon: string
}
