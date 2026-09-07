import { allPages } from '../client'
import type { Game, GameResponse } from './model'

export async function getGames(signal: AbortSignal): Promise<Game[]> {
  // The server owns Steam aggregation and display-hour rounding.
  return (await allPages<GameResponse>('/games', signal)).map(game => ({ ...game, cover: game.cover.url }))
}
