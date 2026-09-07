import type { Media, OrderedContent } from '../model'

export interface Social extends OrderedContent {
  name: string
  platform: string
  url: string
  iconKey: string
  iconMediaId: number | null
  darkIconMediaId: number | null
  icon: Media | null
  darkIcon: Media | null
}
