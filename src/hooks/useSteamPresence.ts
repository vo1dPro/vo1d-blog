import { useEffect, useState } from 'react'
import { getGamePresence } from '@/services/games/presence'
import type { GamePresence } from '@/services/games/presence'

export function useSteamPresence() {
  const [presence, setPresence] = useState<GamePresence | null>(null)
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let disposed = false
    let timer: number | undefined
    let controller: AbortController | undefined
    let pending = false
    async function update() {
      if (pending || disposed) return
      if (document.hidden) {
        timer = window.setTimeout(update, 30_000)
        return
      }
      pending = true
      setLoading(true)
      let delay = 30_000
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 20_000)
      try {
        const body = await getGamePresence(controller.signal)
        if (!disposed) {
          setPresence(body)
          setExpired(Date.parse(body.expiresAt) <= Date.now())
        }
        // A shared server snapshot may already be near its next refresh.
        delay = Math.max(
          1_000,
          Math.min(
            Date.parse(body.updatedAt) + body.refreshAfterMs - Date.now(),
            180_000,
          ),
        )
      } catch {
        if (!disposed) {
          setPresence(null)
          setExpired(true)
        }
      } finally {
        window.clearTimeout(timeout)
        pending = false
        if (!disposed) {
          setLoading(false)
          timer = window.setTimeout(update, delay)
        }
      }
    }
    function visibilityChanged() {
      if (document.hidden || pending) return
      window.clearTimeout(timer)
      void update()
    }
    void update()
    document.addEventListener('visibilitychange', visibilityChanged)
    return () => {
      disposed = true
      window.clearTimeout(timer)
      controller?.abort()
      document.removeEventListener('visibilitychange', visibilityChanged)
    }
  }, [revision])

  useEffect(() => {
    if (!presence) return
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, Date.parse(presence.expiresAt) - Date.now()),
    )
    return () => window.clearTimeout(timer)
  }, [presence])

  return {
    presence,
    loading,
    expired,
    refresh: () => setRevision((value) => value + 1),
  }
}
