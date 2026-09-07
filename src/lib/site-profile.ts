import { createContext, useContext } from 'react'
import type { PublicSiteProfile } from './public-content'

export const SiteProfileContext = createContext<PublicSiteProfile | null>(null)
export const useSiteProfile = () => useContext(SiteProfileContext)
