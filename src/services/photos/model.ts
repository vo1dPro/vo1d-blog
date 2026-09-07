import type { Media, OrderedContent } from '../model'

export interface PhotoResponse extends OrderedContent {
  original: Media
  thumbnail: Media
  originalMediaId: number
  thumbnailMediaId: number
  alt: string
  title: string
  description: string
  capturedAt: string | null
}

export interface Photo extends PhotoResponse { src: string; thumbnailSrc: string }
