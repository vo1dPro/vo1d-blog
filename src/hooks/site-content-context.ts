import { createContext, useContext } from 'react'
import type { PublicQuery } from './usePublicQuery'
import type { SiteProfile } from '@/services/site-profile/model'
import type { Social } from '@/services/social-links/model'

export const SiteContentContext = createContext<{
  profile: PublicQuery<SiteProfile>
  socials: PublicQuery<Social[]>
} | null>(null)

export function useSiteContent() {
  const value = useContext(SiteContentContext)
  if (!value) throw new Error('SiteContentProvider is required')
  return value
}
