export function ContentStatus({ error, loading, empty, retry }: {
  error: string | null; loading: boolean; empty: boolean; retry: () => void
}) {
  if (error) return <p role="status" className="text-sm text-muted-foreground">{error} <button type="button" className="underline" onClick={retry}>重试</button></p>
  if (loading) return <p role="status" className="text-sm text-muted-foreground">正在加载…</p>
  if (empty) return <p className="text-sm text-muted-foreground">暂无公开内容。</p>
  return null
}
