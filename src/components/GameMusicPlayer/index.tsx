import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import {
  Gamepad2,
  Heart,
  Infinity as InfinityIcon,
  MoreHorizontal,
  Repeat2,
  Shuffle,
  Star,
  Volume,
  Volume2,
} from 'lucide-react'
import type { Game } from '@/types'
import './index.css'

const GlockModel = lazy(() => import('../GlockModel'))
const XboxControllerModel = lazy(() => import('../XboxControllerModel'))

interface GameMusicPlayerProps {
  games: Game[]
}

type PlayerMode = 'cover' | 'review' | 'list'
type CoverPalette = {
  primary: string
  secondary: string
  accent: string
  deep: string
  glow: string
}

type PlayerStyle = CSSProperties & Record<`--${string}`, string>

type AppleIconName =
  | 'pause'
  | 'previous'
  | 'next'
  | 'review-outline'
  | 'list-lines'
  | 'cellular'
  | 'wifi'
  | 'row-lines'

const PHONE_WIDTH = 433
const PHONE_HEIGHT = 882
const SCREEN_X = 21.25
const SCREEN_Y = 19.25
const SCREEN_WIDTH = 389.5
const SCREEN_HEIGHT = 843.5
const SCREEN_RADIUS = 55.75
const DESKTOP_MODELS_QUERY = '(min-width: 761px)'
const DEFAULT_PALETTE: CoverPalette = {
  primary: 'rgb(113, 48, 54)',
  secondary: 'rgb(129, 36, 79)',
  accent: 'rgb(214, 144, 86)',
  deep: 'rgb(21, 7, 19)',
  glow: 'rgba(214, 144, 86, 0.24)',
}
const coverPaletteCache = new Map<string, CoverPalette>()

function palettesEqual(left: CoverPalette, right: CoverPalette) {
  return left.primary === right.primary
    && left.secondary === right.secondary
    && left.accent === right.accent
    && left.deep === right.deep
    && left.glow === right.glow
}

function paletteToStyle(palette: CoverPalette): PlayerStyle {
  return {
    '--game-bg-primary': palette.primary,
    '--game-bg-secondary': palette.secondary,
    '--game-bg-accent': palette.accent,
    '--game-bg-deep': palette.deep,
    '--game-bg-glow': palette.glow,
  }
}

function AppleIcon({ name, className }: { name: AppleIconName; className?: string }) {
  return (
    <span
      className={`apple-icon apple-icon-${name} ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

function MagicIphoneFrame() {
  return (
    <svg
      viewBox={`0 0 ${PHONE_WIDTH} ${PHONE_HEIGHT}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="magic-iphone-svg"
      aria-hidden="true"
    >
      <g mask="url(#screenPunch)">
        <path
          d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
          className="magic-iphone-outer"
        />
        <path
          d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"
          className="magic-iphone-button"
        />
        <path
          d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"
          className="magic-iphone-button"
        />
        <path
          d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"
          className="magic-iphone-button"
        />
        <path
          d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"
          className="magic-iphone-button"
        />
        <path
          d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
          className="magic-iphone-inner"
        />
      </g>

      <path
        opacity="0.5"
        d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"
        className="magic-iphone-highlight"
      />

      <path
        d={`M${SCREEN_X} 75C${SCREEN_X} 44.2101 46.2101 ${SCREEN_Y} 77 ${SCREEN_Y}H355C385.79 ${SCREEN_Y} 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 ${SCREEN_X} 837.79 ${SCREEN_X} 807V75Z`}
        className="magic-iphone-screen-rim"
        mask="url(#screenPunch)"
      />

      <path
        d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
        className="magic-iphone-island"
      />

      <defs>
        <mask id="screenPunch" maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width={PHONE_WIDTH} height={PHONE_HEIGHT} fill="white" />
          <rect
            x={SCREEN_X}
            y={SCREEN_Y}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            rx={SCREEN_RADIUS}
            ry={SCREEN_RADIUS}
            fill="black"
          />
        </mask>
      </defs>
    </svg>
  )
}

function formatHours(hours: number) {
  return `${hours}h`
}

function formatStatusTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatPlatform(game: Game) {
  return game.platform ?? 'undefined'
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function toRgb(color: [number, number, number]) {
  return `rgb(${clampColor(color[0])}, ${clampColor(color[1])}, ${clampColor(color[2])})`
}

function toRgba(color: [number, number, number], alpha: number) {
  return `rgba(${clampColor(color[0])}, ${clampColor(color[1])}, ${clampColor(color[2])}, ${alpha})`
}

function mixColor(
  color: [number, number, number],
  target: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    color[0] + (target[0] - color[0]) * amount,
    color[1] + (target[1] - color[1]) * amount,
    color[2] + (target[2] - color[2]) * amount,
  ]
}

function backgroundSafeColor(
  color: [number, number, number],
  darken = 0.42,
  desaturate = 0.18,
): [number, number, number] {
  const gray = (color[0] * 0.299) + (color[1] * 0.587) + (color[2] * 0.114)
  const muted = mixColor(color, [gray, gray, gray], desaturate)
  return mixColor(muted, [8, 8, 10], darken)
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2

  if (max === min) {
    return { hue: 0, saturation: 0, lightness }
  }

  const delta = max - min
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min)
  let hue: number

  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6
  else if (max === g) hue = ((b - r) / delta + 2) / 6
  else hue = ((r - g) / delta + 4) / 6

  return { hue, saturation, lightness }
}

function extractCoverPalette(src: string) {
  return new Promise<CoverPalette>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 36
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        reject(new Error('Canvas is unavailable'))
        return
      }

      context.drawImage(image, 0, 0, size, size)
      const pixels = context.getImageData(0, 0, size, size).data
      const buckets = Array.from({ length: 18 }, () => ({
        red: 0,
        green: 0,
        blue: 0,
        weight: 0,
        score: 0,
      }))
      let red = 0
      let green = 0
      let blue = 0
      let total = 0
      let accent: [number, number, number] = [214, 144, 86]
      let accentScore = 0

      for (let index = 0; index < pixels.length; index += 4) {
        const alpha = pixels[index + 3] / 255
        if (alpha < 0.45) continue

        const r = pixels[index]
        const g = pixels[index + 1]
        const b = pixels[index + 2]
        const { hue, saturation, lightness } = rgbToHsl(r, g, b)
        const balancedLightness = 1 - Math.abs(lightness - 0.48)
        const weight = alpha * (0.25 + saturation) * Math.max(0.28, balancedLightness)
        const bucket = buckets[Math.min(17, Math.floor(hue * buckets.length))]

        red += r * weight
        green += g * weight
        blue += b * weight
        total += weight

        bucket.red += r * weight
        bucket.green += g * weight
        bucket.blue += b * weight
        bucket.weight += weight
        bucket.score += weight * (0.7 + saturation) * Math.max(0.35, balancedLightness)

        const candidateScore = saturation * Math.max(0, 1 - Math.abs(lightness - 0.5)) * alpha
        if (candidateScore > accentScore) {
          accentScore = candidateScore
          accent = [r, g, b]
        }
      }

      if (!total) {
        resolve(DEFAULT_PALETTE)
        return
      }

      const average: [number, number, number] = [red / total, green / total, blue / total]
      const dominantBucket = buckets.reduce((best, bucket) => (
        bucket.score > best.score ? bucket : best
      ), buckets[0])
      const dominant: [number, number, number] = dominantBucket.weight
        ? [
            dominantBucket.red / dominantBucket.weight,
            dominantBucket.green / dominantBucket.weight,
            dominantBucket.blue / dominantBucket.weight,
          ]
        : average
      const primary = backgroundSafeColor(mixColor(dominant, average, 0.28), 0.5, 0.24)
      const secondary = backgroundSafeColor(mixColor(accent, primary, 0.44), 0.56, 0.34)
      const accentColor = backgroundSafeColor(accent, 0.34, 0.22)
      const deep = mixColor(primary, [4, 4, 6], 0.76)

      resolve({
        primary: toRgb(primary),
        secondary: toRgb(secondary),
        accent: toRgb(accentColor),
        deep: toRgb(deep),
        glow: toRgba(accentColor, 0.22),
      })
    }
    image.onerror = () => reject(new Error(`Unable to load cover: ${src}`))
    image.src = src
  })
}

function CoverTile({ game, compact = false }: { game: Game; compact?: boolean }) {
  return (
    <div className={compact ? 'game-cover game-cover-compact' : 'game-cover'}>
      {game.cover ? (
        <img src={game.cover} alt={game.title} draggable={false} />
      ) : (
        <div className="game-cover-empty" aria-hidden="true" />
      )}
    </div>
  )
}

export default function GameMusicPlayer({ games: sourceGames }: GameMusicPlayerProps) {
  // The displayed list and transport buttons must use the same playtime order.
  const games = useMemo(() => [...sourceGames].sort((left, right) => {
    const hoursDiff = right.playtimeHours - left.playtimeHours
    if (hoursDiff !== 0) return hoursDiff

    const ratingDiff = right.rating - left.rating
    if (ratingDiff !== 0) return ratingDiff

    return left.title.localeCompare(right.title, 'zh-Hans-CN')
  }), [sourceGames])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mode, setMode] = useState<PlayerMode>('cover')
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [screenAwake, setScreenAwake] = useState(false)
  const [statusDate, setStatusDate] = useState(() => new Date())
  const [activePalette, setActivePalette] = useState<CoverPalette>(DEFAULT_PALETTE)
  const [previousPalette, setPreviousPalette] = useState<CoverPalette | null>(null)
  const [shouldRenderModels, setShouldRenderModels] = useState(() =>
    window.matchMedia(DESKTOP_MODELS_QUERY).matches,
  )
  const [modelsRequested, setModelsRequested] = useState(false)
  const [playerScale, setPlayerScale] = useState(1)
  const phoneFrameRef = useRef<HTMLDivElement | null>(null)
  const showcaseRef = useRef<HTMLDivElement | null>(null)
  const libraryListRef = useRef<HTMLDivElement | null>(null)
  const activePaletteRef = useRef(DEFAULT_PALETTE)
  const paletteFadeTimerRef = useRef<number | null>(null)
  const libraryDragRef = useRef({
    active: false,
    moved: false,
    startY: 0,
    scrollTop: 0,
    suppressClick: false,
  })

  const game = games[currentIndex]
  const isLiked = likedIds.has(game.id)
  const statusTime = formatStatusTime(statusDate)
  const libraryGames = useMemo(
    () => games
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => index !== currentIndex),
    [currentIndex, games],
  )
  const totalGameHours = useMemo(
    () => games.reduce((total, item) => total + item.playtimeHours, 0),
    [games],
  )

  const progress = useMemo(() => {
    if (!totalGameHours) return 0
    return Math.min(100, Math.round((game.playtimeHours / totalGameHours) * 100))
  }, [game.playtimeHours, totalGameHours])

  useLayoutEffect(() => {
    const frame = phoneFrameRef.current
    if (!frame) return

    // Keep the player on its 368px design canvas as the phone frame resizes.
    const updateScale = (width: number) => {
      if (width > 0) setPlayerScale(width / 368)
    }
    updateScale(frame.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateScale(entry.contentRect.width)
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setStatusDate(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MODELS_QUERY)
    const updateModelVisibility = () => setShouldRenderModels(mediaQuery.matches)

    updateModelVisibility()
    mediaQuery.addEventListener('change', updateModelVisibility)
    return () => mediaQuery.removeEventListener('change', updateModelVisibility)
  }, [])

  useEffect(() => {
    const showcase = showcaseRef.current
    if (!showcase || !shouldRenderModels || modelsRequested) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setModelsRequested(true)
        observer.disconnect()
      }
    }, { rootMargin: '300px' })
    observer.observe(showcase)
    return () => observer.disconnect()
  }, [shouldRenderModels, modelsRequested])

  useEffect(() => () => {
    if (paletteFadeTimerRef.current !== null) {
      window.clearTimeout(paletteFadeTimerRef.current)
    }
  }, [])

  function applyPalette(nextPalette: CoverPalette) {
    const currentPalette = activePaletteRef.current
    if (palettesEqual(currentPalette, nextPalette)) return

    if (paletteFadeTimerRef.current !== null) {
      window.clearTimeout(paletteFadeTimerRef.current)
    }

    activePaletteRef.current = nextPalette
    setPreviousPalette(currentPalette)
    setActivePalette(nextPalette)
    paletteFadeTimerRef.current = window.setTimeout(() => {
      setPreviousPalette(null)
      paletteFadeTimerRef.current = null
    }, 620)
  }

  useEffect(() => {
    if (!game.cover) {
      applyPalette(DEFAULT_PALETTE)
      return
    }

    const cachedPalette = coverPaletteCache.get(game.cover)
    if (cachedPalette) {
      applyPalette(cachedPalette)
      return
    }

    let isCanceled = false
    extractCoverPalette(game.cover)
      .then((nextPalette) => {
        coverPaletteCache.set(game.cover, nextPalette)
        if (!isCanceled) applyPalette(nextPalette)
      })
      .catch(() => {
        if (!isCanceled) applyPalette(DEFAULT_PALETTE)
      })

    return () => {
      isCanceled = true
    }
  }, [game.cover])

  function selectGame(index: number, event: MouseEvent<HTMLButtonElement>) {
    // Keyboard activation has no pointer gesture and must still work after a drag.
    if (event.detail !== 0 && libraryDragRef.current.suppressClick) return
    setCurrentIndex(index)
  }

  function handleLibraryPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    libraryDragRef.current = {
      active: true,
      moved: false,
      startY: event.clientY,
      scrollTop: event.currentTarget.scrollTop,
      suppressClick: false,
    }
  }

  function handleLibraryPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = libraryDragRef.current
    if (!drag.active) return

    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaY) > 8) {
      drag.moved = true
      drag.suppressClick = true
    }

    // Touch uses native scrolling. Capture only an actual mouse drag so a tap's
    // click keeps its original button target, without reordering on pointerup.
    if (drag.moved && event.pointerType === 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
      event.currentTarget.scrollTop = drag.scrollTop - deltaY / playerScale
    }
  }

  function handleLibraryPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const drag = libraryDragRef.current
    if (!drag.active) return

    drag.active = false
    if (event.type === 'pointercancel') drag.suppressClick = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function nextGame() {
    setCurrentIndex((index) => (index + 1) % games.length)
  }

  function prevGame() {
    setCurrentIndex((index) => (index - 1 + games.length) % games.length)
  }

  function toggleLike() {
    setLikedIds((current) => {
      const next = new Set(current)
      if (next.has(game.id)) next.delete(game.id)
      else next.add(game.id)
      return next
    })
  }

  function toggleMode(nextMode: PlayerMode) {
    setMode((current) => current === nextMode ? 'cover' : nextMode)
  }

  const paletteStyle = paletteToStyle(activePalette)
  const previousPaletteStyle = previousPalette ? paletteToStyle(previousPalette) : undefined

  return (
    <div ref={showcaseRef} className="game-showcase" aria-label="Game collection display">
      <div className="game-phone-stage">
        {shouldRenderModels && modelsRequested && (
          <Suspense fallback={null}>
            <XboxControllerModel className="game-controller-stage" />
            <GlockModel className="game-glock-stage" />
          </Suspense>
        )}

        <div
          ref={phoneFrameRef}
          className="iphone-device-frame"
          style={{ '--game-player-scale': playerScale } as CSSProperties}
          aria-label="iPhone 17 game player mockup"
        >
          <div className="iphone-screen-slot">
            <div
              className={`game-player-shell game-player-${mode} ${screenAwake ? '' : 'is-screen-off'}`}
              style={paletteStyle}
            >
              <div className="game-bg-layer game-bg-layer-current" style={paletteStyle} aria-hidden="true" />
              {previousPaletteStyle && (
                <div className="game-bg-layer game-bg-layer-previous" style={previousPaletteStyle} aria-hidden="true" />
              )}
              <div className="game-player-noise" aria-hidden="true" />

          <div className="game-status-bar">
            <span className="game-status-time">{statusTime}</span>
            <span className="game-status-icons" aria-hidden="true">
              <AppleIcon name="cellular" className="apple-icon-cellular" />
              <AppleIcon name="wifi" className="apple-icon-wifi" />
              <img className="game-status-battery" src="/images/apple-icons/power-full.png" alt="" />
            </span>
          </div>
          <div className="game-home-indicator" aria-hidden="true" />

          <div className="game-player-content">
            <div className="game-cover-motion">
              <CoverTile game={game} />
            </div>

            <div className={`game-home-panel ${mode === 'cover' ? 'is-active' : ''}`}>
              <div className="game-title-row">
                <div className="game-track-copy">
                  <div className="game-track-title">{game.title}</div>
                  <div className="game-track-subtitle">{formatPlatform(game)}</div>
                </div>
                <button
                  className={`game-round-action ${isLiked ? 'is-liked' : ''}`}
                  onClick={toggleLike}
                  aria-label="Like game"
                >
                  <Star size={20} fill="currentColor" strokeWidth={0} />
                </button>
                <button className="game-round-action" aria-label="More game actions">
                  <MoreHorizontal size={20} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className={`game-compact-header ${mode !== 'cover' ? 'is-active' : ''}`}>
              <div className="game-compact-now">
                <div className="game-cover-compact-spacer" />
                <div>
                  <div className="game-track-title compact">{game.title}</div>
                  <div className="game-track-subtitle">{formatPlatform(game)}</div>
                </div>
                <button
                  className={`game-round-action ${isLiked ? 'is-liked' : ''}`}
                  onClick={toggleLike}
                  aria-label="Like game"
                >
                  <Star size={19} fill="currentColor" strokeWidth={0} />
                </button>
                <button className="game-round-action" aria-label="More game actions">
                  <MoreHorizontal size={19} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div className={`game-review-panel game-mode-panel ${mode === 'review' ? 'is-active' : ''}`}>
              <div className="game-review-copy">
                <p className="game-review-kicker">我的评价</p>
                <p className="game-review-main">{game.comment}</p>
                <p className="game-review-ghost">
                  游玩 {formatHours(game.playtimeHours)} / 总计 {formatHours(totalGameHours)}
                </p>
              </div>
            </div>

            <div className={`game-list-panel game-mode-panel ${mode === 'list' ? 'is-active' : ''}`}>
              <div className="game-mode-chips" aria-hidden="true">
                <span><Shuffle size={16} /></span>
                <span><Repeat2 size={19} /></span>
                <span className="active"><InfinityIcon size={23} /></span>
                <span className="active"><Gamepad2 size={20} /></span>
              </div>

              <div className="game-list-heading">
                <h4>继续游玩</h4>
                <p>来自玩过的游戏</p>
              </div>

              <div
                ref={libraryListRef}
                className="game-library-list"
                onPointerDown={handleLibraryPointerDown}
                onPointerMove={handleLibraryPointerMove}
                onPointerUp={handleLibraryPointerEnd}
                onPointerCancel={handleLibraryPointerEnd}
                onDragStart={(event) => event.preventDefault()}
              >
                {libraryGames.map(({ item, index }) => (
                  <button
                    key={item.id}
                    type="button"
                    className="game-library-row"
                    onClick={(event) => selectGame(index, event)}
                  >
                    <CoverTile game={item} compact />
                    <span className="game-library-text">
                      <strong>{item.title}</strong>
                      <small>{formatPlatform(item)}</small>
                    </span>
                    <AppleIcon name="row-lines" className="apple-icon-row-lines" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="game-progress-area">
            <div className="game-slider">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="game-time-row">
              <span>{formatHours(game.playtimeHours)}</span>
              <span>{formatHours(totalGameHours)}</span>
            </div>
          </div>

          <div className="game-control-row">
            <button className="game-skip-button" onClick={prevGame} aria-label="Previous game">
              <AppleIcon name="previous" />
            </button>
            <button className="game-pause-button" aria-label="Pause game display">
              <AppleIcon name="pause" />
            </button>
            <button className="game-skip-button" onClick={nextGame} aria-label="Next game">
              <AppleIcon name="next" />
            </button>
          </div>

          <div className="game-volume-area">
            <Volume size={19} fill="currentColor" strokeWidth={0} />
            <div className="game-slider">
              <span style={{ width: `${game.likeLevel}%` }} />
            </div>
            <Volume2 size={24} />
          </div>

          <div className="game-bottom-nav">
            <button
              className={mode === 'review' ? 'active' : ''}
              onClick={() => toggleMode('review')}
              aria-label="Show my review"
            >
              <AppleIcon name="review-outline" />
            </button>
            <button
              className={isLiked ? 'active is-liked' : ''}
              onClick={toggleLike}
              aria-label="Like current game"
            >
              <Heart size={25} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button
              className={mode === 'list' ? 'active' : ''}
              onClick={() => toggleMode('list')}
              aria-label="Show game list"
            >
              <AppleIcon name="list-lines" />
            </button>
          </div>

            </div>
          </div>
          <MagicIphoneFrame />
          <button
            className="iphone-power-hotspot"
            type="button"
            aria-label={screenAwake ? 'Turn screen off' : 'Turn screen on'}
            aria-pressed={!screenAwake}
            onClick={() => setScreenAwake((current) => !current)}
          >
            <span className="iphone-power-cursor" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
