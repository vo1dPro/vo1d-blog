import { allPages } from '../client'
import type { Skill } from './model'

export const getSkills = (signal: AbortSignal) => allPages<Skill>('/skills', signal)
