import { allPages } from '../client'
import type { Tag } from './model'

export const getTags = (signal: AbortSignal) => allPages<Tag>('/tags', signal)
