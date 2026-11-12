import { wordBlocks, wordViewBox } from '@/lib/pixel-glyphs'

// One merged path, so adjoining blocks can never show an anti-aliasing seam.
const PATH = wordBlocks('VO1D').map(block => block.path).join('')
const VIEW_BOX = wordViewBox('VO1D')

/** The VO1D wordmark as inline SVG; it takes the current text colour. */
export default function Vo1dLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={VIEW_BOX} fill="currentColor" role="img" aria-label="VO1D">
      <path d={PATH} />
    </svg>
  )
}
