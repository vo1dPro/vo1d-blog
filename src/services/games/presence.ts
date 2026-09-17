import { ApiError, request } from '../client'
import type { Game, GameResponse } from './model'

export interface GamePresence {
  source: 'steam'
  state: 'playing' | 'idle' | 'unavailable' | 'unconfigured'
  game: Game | null
  totalGameHours: number
  updatedAt: string
  expiresAt: string
  refreshAfterMs: number
}

export async function getGamePresence(
  signal: AbortSignal,
): Promise<GamePresence> {
  const value = await request<
    Omit<GamePresence, 'game'> & { game: GameResponse | null }
  >('/games/playing', signal)
  if (
    value.source !== 'steam' ||
    !['playing', 'idle', 'unavailable', 'unconfigured'].includes(value.state) ||
    !Number.isFinite(Date.parse(value.expiresAt)) ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    !Number.isFinite(value.refreshAfterMs) ||
    value.refreshAfterMs < 0 ||
    !Number.isFinite(value.totalGameHours) ||
    value.totalGameHours < 0 ||
    (value.state === 'playing' &&
      (!value.game ||
        typeof value.game.cover?.url !== 'string' ||
        typeof value.game.usesController !== 'boolean' ||
        !Number.isFinite(value.game.playtimeHours) ||
        value.game.playtimeHours < 0))
  ) {
    throw new ApiError(200, 'Invalid Steam presence response')
  }
  return {
    ...value,
    game: value.game ? { ...value.game, cover: value.game.cover.url } : null,
  }
}
