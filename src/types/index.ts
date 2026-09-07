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
  sourceName: string
  sourceUrl: string
  readingOrder: number
  readingTime: string
  startedAt?: string
  finishedAt?: string
  progress: number
}

export interface Game {
  id: number
  title: string
  platform?: string
  cover: string
  rating: number
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
