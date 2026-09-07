import { allPages } from '../client'
import type { Social } from './model'

export const getSocialLinks = (signal: AbortSignal) => allPages<Social>('/social-links', signal)
