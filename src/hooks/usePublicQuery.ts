import { useCallback, useEffect, useMemo, useState } from 'react'

export type QueryResult<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

export type PublicQuery<T> = QueryResult<T> & { retry: () => void }

export function usePublicQuery<T>(load: (signal: AbortSignal) => Promise<T>): PublicQuery<T> {
  const [attempt, setAttempt] = useState(0)
  const token = useMemo(() => ({ load, attempt }), [load, attempt])
  const [settled, setSettled] = useState<{ token: typeof token; result: QueryResult<T> } | null>(null)
  const retry = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    void token.load(controller.signal).then(data => {
      if (!controller.signal.aborted) setSettled({ token, result: { status: 'success', data } })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setSettled({ token, result: {
        status: 'error', error: error instanceof Error ? error : new Error('Unable to load content.'),
      } })
    })
    return () => controller.abort()
  }, [token])

  // A new key never renders the previous key's successful content, even before the effect runs.
  return { ...(settled?.token === token ? settled.result : { status: 'loading' as const }), retry }
}
