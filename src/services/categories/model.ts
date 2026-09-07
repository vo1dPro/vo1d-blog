import type { OrderedContent } from '../model'

export interface Category extends OrderedContent {
  key: string
  label: string
  iconKey: string | null
}

export interface ArticleCategory { key: string; label: string; icon: string | null }
