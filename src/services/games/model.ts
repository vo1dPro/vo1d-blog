import type { Media, OrderedContent } from '../model'

export interface SteamGame {
  appId: number
  name: string
  playtimeMinutes: number
  playtimeTwoWeeksMinutes: number | null
  lastPlayedAt: string | null
  syncedAt: string
  stale: boolean
  incomplete: boolean
  accountBreakdown: { accountName: string; playtimeMinutes: number; stale: boolean }[]
  storeUrl: string
}

export interface GameResponse extends OrderedContent {
  title: string
  platform: string | null
  cover: Media
  coverMediaId: number
  rating: number
  playtimeHours: number
  usesController: boolean
  manualPlaytimeHours: number
  steamAppId: number | null
  steam: SteamGame | null
  likeLevel: number
  comment: string | null
}

export interface Game extends Omit<GameResponse, 'cover'> { cover: string }
