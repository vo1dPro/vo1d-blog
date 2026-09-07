import type { Media, OrderedContent } from '../model'

export interface BookResponse extends OrderedContent {
  title: string
  author: string
  cover: Media
  coverMediaId: number
  accent: string
  sourceName: string | null
  sourceUrl: string | null
  readingOrder: number
  lastReadAt: string | null
  startedAt: string | null
  finishedAt: string | null
  progress: number
}

export interface Book extends Omit<BookResponse, 'cover'> {
  cover: string
  readingTime: string | null
}
