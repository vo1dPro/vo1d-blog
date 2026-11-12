import { useEffect, useState, type RefObject } from 'react'
import { BLOCK, BLOCK_RADIUS, LETTER_PITCH, WORD_ROWS as LOGO_ROWS, wordColumns, wordGlyphs, type PixelGlyph } from '@/lib/pixel-glyphs'

const SPRING = 120
const DAMPING = 14
const REPEL_RADIUS = 7
const HOVER_RADIUS = 3.4
const RIPPLE_SPEED = 62
const RIPPLE_BAND = 2.4

export type PixelFieldPhase = 'idle' | 'flying' | 'assembled'

// Set by the opening screen once it has drawn the wordmark in place.
function openingHandedOff() {
  return document.documentElement.dataset.openingHandoff === '1'
}

interface Pixel {
  col: number
  row: number
  x: number
  y: number
  vx: number
  vy: number
  delay: number
  dirX: number
  dirY: number
  born: boolean
  // Which block corner this pixel sits on (0 tl, 1 tr, 2 br, 3 bl), or -1.
  corner: number
}

interface Ripple {
  x: number
  y: number
  startedAt: number
}

// Only convex corners of the outline are rounded; blocks that share an edge stay flush.
function outlineCorner(glyph: PixelGlyph, blockCol: number, blockRow: number, sx: number, sy: number) {
  const edgeX = sx === 0 ? -1 : sx === BLOCK - 1 ? 1 : 0
  const edgeY = sy === 0 ? -1 : sy === BLOCK - 1 ? 1 : 0
  if (edgeX === 0 || edgeY === 0) return -1
  if (glyph[blockRow]?.[blockCol + edgeX] === "X" || glyph[blockRow + edgeY]?.[blockCol] === "X") return -1
  return edgeY < 0 ? (edgeX < 0 ? 0 : 1) : edgeX < 0 ? 3 : 2
}

function createPixels(glyphs: PixelGlyph[], columns: number): Pixel[] {
  const pixels: Pixel[] = []
  glyphs.forEach((glyph, letter) => {
    glyph.forEach((line, blockRow) => {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        if (line[blockCol] !== 'X') continue
        for (let sy = 0; sy < BLOCK; sy++) {
          for (let sx = 0; sx < BLOCK; sx++) {
            const col = letter * LETTER_PITCH + blockCol * BLOCK + sx
            const angle = Math.random() * Math.PI * 2
            pixels.push({
              col,
              row: blockRow * BLOCK + sy,
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              delay: (col / columns) * 0.5 + Math.random() * 0.45,
              dirX: Math.cos(angle),
              dirY: Math.sin(angle),
              born: false,
              corner: outlineCorner(glyph, blockCol, blockRow, sx, sy),
            })
          }
        }
      }
    })
  })
  return pixels
}

interface PixelFieldOptions {
  text: string
  sectionRef: RefObject<HTMLElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  // Element whose box reserves the word's footprint; the canvas paints the blocks inside it.
  anchorRef: RefObject<HTMLElement | null>
}

/** Paints an interactive pixel grid with a block-letter word assembled from it. */
export function usePixelField({ text, sectionRef, canvasRef, anchorRef }: PixelFieldOptions) {
  const [phase, setPhase] = useState<PixelFieldPhase>('idle')

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const logoBox = anchorRef.current
    const context = canvas?.getContext('2d')
    if (!section || !canvas || !logoBox || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const glyphs = wordGlyphs(text)
    const LOGO_COLS = wordColumns(glyphs.length)
    const pixels = createPixels(glyphs, LOGO_COLS)
    // Assembled pixels skip the fly-in: the opening screen has already built the wordmark.
    let assembled = reducedMotion
    const backdrop = document.createElement('canvas')
    const ripples: Ripple[] = []
    const pointer = { x: 0, y: 0, active: false }

    let width = 0
    let height = 0
    let cell = 0
    let originX = 0
    let originY = 0
    let gridX = 0
    let gridY = 0
    let cols = 0
    let rows = 0
    let hover = new Float32Array(0)
    let wave = new Float32Array(0)
    let foreground = '#fff'
    let accent = '#0a84ff'
    let boxKey = ''
    let startedAt = -1
    let last = 0
    let frame = 0
    let visible = true

    const readColors = () => {
      const styles = getComputedStyle(document.documentElement)
      foreground = styles.getPropertyValue('--foreground').trim() || foreground
      accent = styles.getPropertyValue('--primary').trim() || accent
    }

    const drawBackdrop = () => {
      backdrop.width = width
      backdrop.height = height
      const layer = backdrop.getContext('2d')
      if (!layer || cell === 0) return
      const dot = Math.max(1, Math.round(cell / 9))
      const centerX = originX + (LOGO_COLS * cell) / 2
      const centerY = originY + (LOGO_ROWS * cell) / 2
      const reach = Math.max(width, height) * 0.62
      layer.fillStyle = foreground
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = gridX + col * cell
          const y = gridY + row * cell
          const falloff = 1 - Math.hypot(x - centerX, y - centerY) / reach
          if (falloff <= 0.02) continue
          layer.globalAlpha = 0.2 * falloff * falloff
          layer.fillRect(x, y, dot, dot)
        }
      }
    }

    // Everything is laid out in device pixels so blocks stay seamless at fractional DPRs.
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const bounds = section.getBoundingClientRect()
      const box = logoBox.getBoundingClientRect()
      width = Math.round(bounds.width * dpr)
      height = Math.round(bounds.height * dpr)
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height

      cell = Math.max(2, Math.floor((box.width * dpr) / LOGO_COLS))
      originX = Math.round((box.left - bounds.left) * dpr + (box.width * dpr - cell * LOGO_COLS) / 2)
      originY = Math.round((box.top - bounds.top) * dpr + (box.height * dpr - cell * LOGO_ROWS) / 2)
      gridX = (((originX % cell) + cell) % cell) - cell
      gridY = (((originY % cell) + cell) % cell) - cell
      cols = Math.ceil((width - gridX) / cell)
      rows = Math.ceil((height - gridY) / cell)
      hover = new Float32Array(cols * rows)
      wave = new Float32Array(cols * rows)
      drawBackdrop()
    }

    const syncLayout = () => {
      const bounds = section.getBoundingClientRect()
      const box = logoBox.getBoundingClientRect()
      const key = [bounds.width, bounds.height, box.left - bounds.left, box.top - bounds.top, box.width, window.devicePixelRatio]
        .map(value => Math.round(value * 2))
        .join(',')
      if (key === boxKey) return
      boxKey = key
      layout()
    }

    const render = (now: number) => {
      frame = 0
      syncLayout()
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016)
      last = now

      if (startedAt < 0 && (openingHandedOff() || !section.closest('[inert]'))) {
        startedAt = now
        assembled = reducedMotion || openingHandedOff()
        setPhase(assembled ? 'assembled' : 'flying')
      }

      context.clearRect(0, 0, width, height)
      context.globalAlpha = 1
      context.drawImage(backdrop, 0, 0)

      // Pointer glow: cells near the cursor charge up, then fade behind it as a trail.
      if (pointer.active) {
        const pc = (pointer.x - gridX) / cell
        const pr = (pointer.y - gridY) / cell
        const reach = Math.ceil(HOVER_RADIUS)
        for (let row = Math.max(0, Math.floor(pr) - reach); row <= Math.min(rows - 1, Math.floor(pr) + reach); row++) {
          for (let col = Math.max(0, Math.floor(pc) - reach); col <= Math.min(cols - 1, Math.floor(pc) + reach); col++) {
            const distance = Math.hypot(col + 0.5 - pc, row + 0.5 - pr)
            if (distance >= HOVER_RADIUS) continue
            const energy = (1 - distance / HOVER_RADIUS) ** 2
            const index = row * cols + col
            if (energy > hover[index]) hover[index] = energy
          }
        }
      }

      // Click ripples travel across the grid as a ring of lit cells.
      const limit = Math.max(width, height) * 0.95
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]
        const radius = ((now - ripple.startedAt) / 1000) * RIPPLE_SPEED * cell
        if (radius > limit) {
          ripples.splice(i, 1)
          continue
        }
        const strength = 1 - radius / limit
        const band = RIPPLE_BAND * cell
        const outer = radius + band
        const firstRow = Math.max(0, Math.floor((ripple.y - outer - gridY) / cell))
        const lastRow = Math.min(rows - 1, Math.ceil((ripple.y + outer - gridY) / cell))
        const firstCol = Math.max(0, Math.floor((ripple.x - outer - gridX) / cell))
        const lastCol = Math.min(cols - 1, Math.ceil((ripple.x + outer - gridX) / cell))
        for (let row = firstRow; row <= lastRow; row++) {
          const dy = gridY + (row + 0.5) * cell - ripple.y
          for (let col = firstCol; col <= lastCol; col++) {
            const dx = gridX + (col + 0.5) * cell - ripple.x
            const offset = Math.abs(Math.hypot(dx, dy) - radius)
            if (offset >= band) continue
            const energy = (1 - offset / band) * strength
            const index = row * cols + col
            if (energy > wave[index]) wave[index] = energy
          }
        }
      }

      if (!reducedMotion && startedAt >= 0 && Math.random() < dt * 7) {
        const index = Math.floor(Math.random() * hover.length)
        hover[index] = Math.max(hover[index], 0.3 + Math.random() * 0.35)
      }

      const hoverDecay = Math.exp(-dt * 3.2)
      const waveDecay = Math.exp(-dt * 4.5)
      const inset = cell > 4 ? 1 : 0
      context.fillStyle = foreground
      for (let index = 0; index < hover.length; index++) {
        const energy = hover[index]
        if (energy < 0.012) continue
        hover[index] = energy * hoverDecay
        context.globalAlpha = energy * 0.5
        context.fillRect(gridX + (index % cols) * cell + inset, gridY + Math.floor(index / cols) * cell + inset, cell - inset, cell - inset)
      }
      context.fillStyle = accent
      for (let index = 0; index < wave.length; index++) {
        const energy = wave[index]
        if (energy < 0.012) continue
        wave[index] = energy * waveDecay
        context.globalAlpha = Math.min(1, energy)
        context.fillRect(gridX + (index % cols) * cell + inset, gridY + Math.floor(index / cols) * cell + inset, cell - inset, cell - inset)
      }

      // Wordmark pixels: spring home, flee the pointer, ride ripples, dissolve on scroll.
      if (startedAt >= 0) {
        const elapsed = (now - startedAt) / 1000
        const scroll = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / (section.offsetHeight * 0.85)))
        const drift = scroll * scroll * 46 * cell
        const repelRadius = REPEL_RADIUS * cell
        const repelForce = SPRING * 3.4 * cell
        const waveBand = RIPPLE_BAND * 1.6 * cell
        const cornerRadius = BLOCK_RADIUS * BLOCK * cell
        const radii = [0, 0, 0, 0]
        context.fillStyle = foreground

        for (const pixel of pixels) {
          const age = elapsed - pixel.delay
          if (!assembled && age < 0) continue
          if (!pixel.born) {
            pixel.born = true
            if (!assembled) {
              pixel.x = Math.round((pixel.dirX * (8 + Math.random() * 40) * cell) / cell) * cell
              pixel.y = Math.round((pixel.dirY * (8 + Math.random() * 40) * cell) / cell) * cell
            }
          }

          const homeX = originX + pixel.col * cell
          const homeY = originY + pixel.row * cell
          const targetX = pixel.dirX * drift
          const targetY = pixel.dirY * drift

          if (!reducedMotion) {
            let ax = -SPRING * (pixel.x - targetX) - DAMPING * pixel.vx
            let ay = -SPRING * (pixel.y - targetY) - DAMPING * pixel.vy
            const centerX = homeX + pixel.x + cell / 2
            const centerY = homeY + pixel.y + cell / 2

            if (pointer.active) {
              const dx = centerX - pointer.x
              const dy = centerY - pointer.y
              const distance = Math.hypot(dx, dy)
              if (distance < repelRadius && distance > 0.01) {
                const force = (1 - distance / repelRadius) ** 2 * repelForce
                ax += (dx / distance) * force
                ay += (dy / distance) * force
              }
            }

            for (const ripple of ripples) {
              const dx = centerX - ripple.x
              const dy = centerY - ripple.y
              const distance = Math.hypot(dx, dy)
              const radius = ((now - ripple.startedAt) / 1000) * RIPPLE_SPEED * cell
              const offset = Math.abs(distance - radius)
              if (offset >= waveBand || distance < 0.01) continue
              const force = (1 - offset / waveBand) * (1 - radius / limit) * 900 * cell
              ax += (dx / distance) * force
              ay += (dy / distance) * force
            }

            pixel.vx += ax * dt
            pixel.vy += ay * dt
            pixel.x += pixel.vx * dt
            pixel.y += pixel.vy * dt
            if (Math.abs(pixel.x - targetX) < 0.3 && Math.abs(pixel.y - targetY) < 0.3 && Math.abs(pixel.vx) < 3 && Math.abs(pixel.vy) < 3) {
              pixel.x = targetX
              pixel.y = targetY
              pixel.vx = 0
              pixel.vy = 0
            }
          }

          const alpha = (1 - scroll) * (assembled ? 1 : Math.min(1, age / 0.2))
          if (alpha <= 0.01) continue
          const displaced = Math.hypot(pixel.x, pixel.y)
          const size = displaced < 0.5 ? cell : Math.max(Math.ceil(cell * 0.5), Math.round(cell * (1 - Math.min(0.5, displaced / (cell * 9)))))
          const pad = (cell - size) >> 1
          context.globalAlpha = alpha
          const drawX = Math.round(homeX + pixel.x) + pad
          const drawY = Math.round(homeY + pixel.y) + pad
          if (pixel.corner < 0) {
            context.fillRect(drawX, drawY, size, size)
          } else {
            radii[0] = radii[1] = radii[2] = radii[3] = 0
            radii[pixel.corner] = Math.min(cornerRadius, size)
            context.beginPath()
            context.roundRect(drawX, drawY, size, size, radii)
            context.fill()
          }
        }
      }

      if (visible) frame = requestAnimationFrame(render)
    }

    const toCanvas = (event: PointerEvent) => {
      const bounds = section.getBoundingClientRect()
      const scale = width / bounds.width
      return { x: (event.clientX - bounds.left) * scale, y: (event.clientY - bounds.top) * scale }
    }

    const handleMove = (event: PointerEvent) => {
      const point = toCanvas(event)
      pointer.x = point.x
      pointer.y = point.y
      pointer.active = true
    }
    const handleLeave = () => { pointer.active = false }
    const handleDown = (event: PointerEvent) => {
      const point = toCanvas(event)
      if (ripples.length >= 6) ripples.shift()
      ripples.push({ ...point, startedAt: performance.now() })
      if (event.pointerType === 'touch') handleMove(event)
    }
    const handleUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') pointer.active = false
    }

    const themeObserver = new MutationObserver(() => {
      readColors()
      drawBackdrop()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !frame) {
        last = 0
        frame = requestAnimationFrame(render)
      }
    })
    visibilityObserver.observe(section)

    section.addEventListener('pointermove', handleMove)
    section.addEventListener('pointerleave', handleLeave)
    section.addEventListener('pointerdown', handleDown)
    section.addEventListener('pointerup', handleUp)
    section.addEventListener('pointercancel', handleLeave)

    readColors()
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      themeObserver.disconnect()
      visibilityObserver.disconnect()
      section.removeEventListener('pointermove', handleMove)
      section.removeEventListener('pointerleave', handleLeave)
      section.removeEventListener('pointerdown', handleDown)
      section.removeEventListener('pointerup', handleUp)
      section.removeEventListener('pointercancel', handleLeave)
    }
  }, [text, sectionRef, canvasRef, anchorRef])

  return phase
}
