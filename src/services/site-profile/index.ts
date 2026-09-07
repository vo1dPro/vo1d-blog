import { request } from '../client'
import type { SiteProfile } from './model'

export const getSiteProfile = (signal: AbortSignal) => request<SiteProfile>('/site-profile', signal)
