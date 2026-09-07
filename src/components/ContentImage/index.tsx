import { useState, type ImgHTMLAttributes } from 'react'

/** A changed media URL automatically gets a fresh attempt; failures remain visible. */
export default function ContentImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (props.src && failedSrc === props.src) {
    return (
      <span
        role="img"
        aria-label={props.alt || '图片加载失败'}
        className={`${props.className ?? ''} inline-flex items-center justify-center bg-muted text-xs text-muted-foreground`}
      >
        图片加载失败
      </span>
    )
  }
  return <img {...props} onError={() => setFailedSrc(props.src ?? null)} />
}
