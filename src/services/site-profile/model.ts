import type { Media } from '../model'

export interface SiteProfile {
  displayName: string
  role: string
  heroTitlePrefix: string
  heroDescription: string
  learningNote: string
  footerMessage: string
  avatar: Media | null
  updatedAt: string
}
