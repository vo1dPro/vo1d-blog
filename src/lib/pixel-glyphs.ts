// Block letterforms shared by the wordmark, the opening screen and the 404 page.
// Every glyph sits on a 3×3 block grid.
export type PixelGlyph = readonly [string, string, string]

export const PIXEL_GLYPHS: Record<string, PixelGlyph> = {
  V: ['X.X', 'X.X', '.X.'],
  O: ['XXX', 'X.X', 'XXX'],
  D: ['XX.', 'X.X', 'XX.'],
  '0': ['XXX', 'X.X', 'XXX'],
  '1': ['XX.', '.X.', 'XXX'],
  '2': ['XX.', '.X.', '.XX'],
  '3': ['XXX', '.XX', 'XXX'],
  '4': ['X.X', 'XXX', '..X'],
}

// Each block is BLOCK×BLOCK fine cells, so a word sits exactly on the background grid.
export const BLOCK = 5
export const LETTER_GAP = 3
export const LETTER_PITCH = BLOCK * 3 + LETTER_GAP
export const WORD_ROWS = BLOCK * 3
// Corner radius of each block, as a fraction of the block size.
export const BLOCK_RADIUS = 0.1

export function wordGlyphs(text: string): PixelGlyph[] {
  return [...text].flatMap(character => PIXEL_GLYPHS[character] ? [PIXEL_GLYPHS[character]] : [])
}

export function wordColumns(letters: number) {
  return LETTER_PITCH * letters - LETTER_GAP
}

export function hasBlock(glyph: PixelGlyph, col: number, row: number) {
  return glyph[row]?.[col] === 'X'
}

export interface WordBlock {
  letter: number
  col: number
  row: number
  path: string
}

const UNIT = 100
const SVG_PITCH = (UNIT * LETTER_PITCH) / BLOCK
const SVG_RADIUS = UNIT * BLOCK_RADIUS
// Edge-sharing blocks overlap slightly so anti-aliasing never opens a seam between them.
const OVERLAP = 1

// Only convex corners of the outline are rounded; blocks that share an edge stay flush.
function blockPath(glyph: PixelGlyph, col: number, row: number, offsetX: number) {
  const left = hasBlock(glyph, col - 1, row)
  const right = hasBlock(glyph, col + 1, row)
  const up = hasBlock(glyph, col, row - 1)
  const down = hasBlock(glyph, col, row + 1)
  const x0 = offsetX + col * UNIT - (left ? OVERLAP : 0)
  const x1 = offsetX + (col + 1) * UNIT + (right ? OVERLAP : 0)
  const y0 = row * UNIT - (up ? OVERLAP : 0)
  const y1 = (row + 1) * UNIT + (down ? OVERLAP : 0)
  const tl = !left && !up ? SVG_RADIUS : 0
  const tr = !right && !up ? SVG_RADIUS : 0
  const br = !right && !down ? SVG_RADIUS : 0
  const bl = !left && !down ? SVG_RADIUS : 0
  const arc = (radius: number, x: number, y: number) => radius ? `A${radius} ${radius} 0 0 1 ${x} ${y}` : ''
  return `M${x0 + tl} ${y0}H${x1 - tr}${arc(tr, x1, y0 + tr)}V${y1 - br}${arc(br, x1 - br, y1)}H${x0 + bl}${arc(bl, x0, y1 - bl)}V${y0 + tl}${arc(tl, x0 + tl, y0)}Z`
}

export function wordBlocks(text: string): WordBlock[] {
  return wordGlyphs(text).flatMap((glyph, letter) => {
    const blocks: WordBlock[] = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (hasBlock(glyph, col, row)) blocks.push({ letter, col, row, path: blockPath(glyph, col, row, letter * SVG_PITCH) })
      }
    }
    return blocks
  })
}

export function wordViewBox(text: string) {
  const letters = wordGlyphs(text).length
  return `0 0 ${SVG_PITCH * letters - (UNIT * LETTER_GAP) / BLOCK} ${UNIT * 3}`
}
