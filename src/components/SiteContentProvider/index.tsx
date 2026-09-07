import type { ReactNode } from 'react'
import { SiteContentContext } from '@/hooks/site-content-context'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import { getSiteProfile } from '@/services/site-profile'
import { getSocialLinks } from '@/services/social-links'

export default function SiteContentProvider({ children }: { children: ReactNode }) {
  const profile = usePublicQuery(getSiteProfile)
  const socials = usePublicQuery(getSocialLinks)
  return <SiteContentContext.Provider value={{ profile, socials }}>{children}</SiteContentContext.Provider>
}
