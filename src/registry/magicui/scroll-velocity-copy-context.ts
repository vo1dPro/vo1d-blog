import { createContext, useContext } from 'react'

export const ScrollVelocityCopyContext = createContext(0)

export function useScrollVelocityCopyIndex() {
  return useContext(ScrollVelocityCopyContext)
}
