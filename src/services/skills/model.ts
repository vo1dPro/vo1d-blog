import type { Media, OrderedContent } from '../model'

export interface Skill extends OrderedContent {
  name: string
  iconKey: string
  iconMediaId: number | null
  darkIconMediaId: number | null
  icon: Media | null
  darkIcon: Media | null
}
