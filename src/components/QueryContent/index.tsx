import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '@/services/client'
import type { PublicQuery } from '@/hooks/usePublicQuery'

function Retry({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [now, setNow] = useState(Date.now)
  const retryAt = error instanceof ApiError ? error.retryAt : null
  const waiting = retryAt !== null && retryAt > now
  useEffect(() => {
    if (!waiting) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [waiting])
  return <button type="button" disabled={waiting} onClick={onRetry} className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50">
    {waiting ? `Retry in ${Math.ceil((retryAt - now) / 1000)}s` : 'Retry'}
  </button>
}

export default function QueryContent<T>({ query, label, children, isEmpty }: {
  query: PublicQuery<T>
  label: string
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
}) {
  if (query.status === 'success' && !isEmpty?.(query.data)) return children(query.data)
  return <div role="status" aria-live="polite" className="px-6 py-8 text-center text-sm text-muted-foreground" data-content-state={query.status}>
    <p>{query.status === 'loading' ? `Loading ${label}…` : query.status === 'error' ? query.error.message : `No ${label} to display.`}</p>
    {query.status === 'error' && <Retry error={query.error} onRetry={query.retry} />}
  </div>
}
