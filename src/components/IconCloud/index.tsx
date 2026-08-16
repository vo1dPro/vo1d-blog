import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SphereIcon {
  x: number
  y: number
  z: number
  id: number
}

interface ProjectedIcon {
  id: number
  x: number
  y: number
  z: number
  radius: number
}

interface TargetRotation {
  x: number
  y: number
  startX: number
  startY: number
  startTime: number
  duration: number
}

interface IconAsset {
  image: HTMLImageElement
  loaded: boolean
  failed: boolean
}

interface PointerGesture {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastY: number
  hitIconId: number | null
  hasDragged: boolean
}

interface IconCloudProps {
  images?: string[]
  showControl?: boolean
  autoRotateDuration?: number
  className?: string
}

const EMPTY_IMAGES: string[] = []

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function normalizeAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function createSphereIcons(count: number): SphereIcon[] {
  if (count === 0) return []

  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))

  return Array.from({ length: count }, (_, index) => {
    const y = index * offset - 1 + offset / 2
    const radius = Math.sqrt(1 - y * y)
    const phi = index * increment

    return {
      x: Math.cos(phi) * radius,
      y,
      z: Math.sin(phi) * radius,
      id: index,
    }
  })
}

export function IconCloud({
  images,
  showControl = true,
  autoRotateDuration,
  className,
}: IconCloudProps) {
  const sourceImages = images ?? EMPTY_IMAGES
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef(0)
  const requestDrawRef = useRef<() => void>(() => undefined)
  const rotationRef = useRef({ x: -0.18, y: 0.35 })
  const pointerRef = useRef({ x: 0, y: 0, hasMoved: false })
  const pointerGestureRef = useRef<PointerGesture | null>(null)
  const isDraggingRef = useRef(false)
  const targetRotationRef = useRef<TargetRotation | null>(null)
  const projectedIconsRef = useRef<ProjectedIcon[]>([])
  const assetsRef = useRef<IconAsset[]>([])
  const logicalSizeRef = useRef(400)
  const [isPaused, setIsPaused] = useState(false)

  const iconPositions = useMemo(
    () => createSphereIcons(sourceImages.length),
    [sourceImages],
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotionPreference = () => setIsPaused(mediaQuery.matches)

    syncMotionPreference()
    mediaQuery.addEventListener('change', syncMotionPreference)

    return () => mediaQuery.removeEventListener('change', syncMotionPreference)
  }, [])

  useEffect(() => {
    let isActive = true

    const assets = sourceImages.map((src) => {
      const asset: IconAsset = {
        image: new Image(),
        loaded: false,
        failed: false,
      }

      if (/^https?:\/\//.test(src)) {
        asset.image.crossOrigin = 'anonymous'
      }

      asset.image.onload = () => {
        if (!isActive) return
        asset.loaded = true
        requestDrawRef.current()
      }

      asset.image.onerror = () => {
        if (!isActive) return
        asset.failed = true
        requestDrawRef.current()
      }

      asset.image.src = src
      return asset
    })

    assetsRef.current = assets
    requestDrawRef.current()

    return () => {
      isActive = false
    }
  }, [sourceImages])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let isActive = true
    let isInView = false
    let isPageVisible = !document.hidden
    let previousTime = performance.now()
    let autoRotationElapsed = 0

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const size = Math.max(1, rect.width)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)
      const pixelSize = Math.round(size * pixelRatio)

      logicalSizeRef.current = size
      if (!pointerRef.current.hasMoved) {
        pointerRef.current.x = size / 2
        pointerRef.current.y = size / 2
      }

      if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
        canvas.width = pixelSize
        canvas.height = pixelSize
      }
    }

    const drawFrame = (time: number) => {
      animationFrameRef.current = 0
      if (!isActive) return

      const size = logicalSizeRef.current
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)
      const center = size / 2
      const sphereRadius = size * 0.29
      const frameDuration = Math.min(33.34, Math.max(0, time - previousTime))
      const frameScale = Math.min(2, Math.max(0.25, frameDuration / 16.67))
      previousTime = time

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, size, size)

      const target = targetRotationRef.current
      const canAnimate = !isPaused && isInView && isPageVisible
      const canAutoRotate = autoRotateDuration === undefined
        || autoRotationElapsed < autoRotateDuration

      if (target && canAnimate) {
        const progress = Math.min(1, (time - target.startTime) / target.duration)
        const easedProgress = easeOutCubic(progress)

        rotationRef.current.x = target.startX + (target.x - target.startX) * easedProgress
        rotationRef.current.y = target.startY + (target.y - target.startY) * easedProgress

        if (progress >= 1) targetRotationRef.current = null
      } else if (!target && !isDraggingRef.current && canAnimate && canAutoRotate) {
        const pointerX = (pointerRef.current.x - center) / Math.max(center, 1)
        const pointerY = (pointerRef.current.y - center) / Math.max(center, 1)

        rotationRef.current.x += pointerY * 0.00065 * frameScale
        rotationRef.current.y += (0.0022 + pointerX * 0.0013) * frameScale
        autoRotationElapsed += frameDuration
      }

      const cosX = Math.cos(rotationRef.current.x)
      const sinX = Math.sin(rotationRef.current.x)
      const cosY = Math.cos(rotationRef.current.y)
      const sinY = Math.sin(rotationRef.current.y)
      const baseIconSize = Math.min(46, Math.max(32, size * 0.095))

      const projectedIcons = iconPositions.map((icon) => {
        const rotatedX = icon.x * cosY - icon.z * sinY
        const rotatedZ = icon.x * sinY + icon.z * cosY
        const rotatedY = icon.y * cosX + rotatedZ * sinX
        const rotatedDepth = -icon.y * sinX + rotatedZ * cosX
        const depth = (rotatedDepth + 1) / 2
        const scale = 0.68 + depth * 0.54

        return {
          id: icon.id,
          x: center + rotatedX * sphereRadius,
          y: center + rotatedY * sphereRadius,
          z: rotatedDepth,
          radius: (baseIconSize * scale) / 2,
        }
      })

      projectedIcons.sort((left, right) => left.z - right.z)
      projectedIconsRef.current = projectedIcons

      projectedIcons.forEach((icon) => {
        const asset = assetsRef.current[icon.id]
        if (!asset?.loaded || asset.failed) return

        const depth = (icon.z + 1) / 2
        const opacity = 0.3 + depth * 0.7
        const imageMaxSize = icon.radius * 1.72
        const naturalWidth = asset.image.naturalWidth || 1
        const naturalHeight = asset.image.naturalHeight || 1
        const aspectRatio = naturalWidth / naturalHeight
        const imageWidth = aspectRatio >= 1 ? imageMaxSize : imageMaxSize * aspectRatio
        const imageHeight = aspectRatio >= 1 ? imageMaxSize / aspectRatio : imageMaxSize

        context.save()
        context.globalAlpha = opacity
        context.translate(icon.x, icon.y)
        context.drawImage(
          asset.image,
          -imageWidth / 2,
          -imageHeight / 2,
          imageWidth,
          imageHeight,
        )
        context.restore()
      })

      const shouldContinueAutoRotation = autoRotateDuration === undefined
        || autoRotationElapsed < autoRotateDuration

      if (
        canAnimate
        && (targetRotationRef.current || (!isDraggingRef.current && shouldContinueAutoRotation))
      ) {
        animationFrameRef.current = requestAnimationFrame(drawFrame)
      }
    }

    const requestDraw = () => {
      if (!isActive || animationFrameRef.current) return
      animationFrameRef.current = requestAnimationFrame(drawFrame)
    }

    requestDrawRef.current = requestDraw
    if (isPaused) targetRotationRef.current = null
    resizeCanvas()
    requestDraw()

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting

      if (isInView) {
        previousTime = performance.now()
        requestDraw()
      } else {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = 0
      }
    })
    visibilityObserver.observe(canvas)

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden

      if (isPageVisible) {
        previousTime = performance.now()
        requestDraw()
      } else {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = 0
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
      requestDraw()
    })
    resizeObserver.observe(canvas)

    return () => {
      isActive = false
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = 0
      requestDrawRef.current = () => undefined
    }
  }, [autoRotateDuration, iconPositions, isPaused])

  function getPointerPosition(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = logicalSizeRef.current

    return {
      x: ((event.clientX - rect.left) / Math.max(rect.width, 1)) * size,
      y: ((event.clientY - rect.top) / Math.max(rect.height, 1)) * size,
    }
  }

  function focusIcon(iconId: number) {
    const icon = iconPositions[iconId]
    if (!icon) return

    const currentX = rotationRef.current.x
    const currentY = rotationRef.current.y
    const rawTargetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z))
    const targetX = currentX + normalizeAngle(rawTargetX - currentX)
    const rawTargetY = Math.atan2(icon.x, icon.z)
    const targetY = currentY + normalizeAngle(rawTargetY - currentY)
    const distance = Math.hypot(targetX - currentX, targetY - currentY)

    if (isPaused) {
      targetRotationRef.current = null
      rotationRef.current = { x: targetX, y: targetY }
      requestDrawRef.current()
      return
    }

    targetRotationRef.current = {
      x: targetX,
      y: targetY,
      startX: currentX,
      startY: currentY,
      startTime: performance.now(),
      duration: Math.min(1600, Math.max(650, distance * 720)),
    }
    requestDrawRef.current()
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const point = getPointerPosition(event)
    pointerRef.current = { ...point, hasMoved: true }

    const hitIcon = [...projectedIconsRef.current]
      .sort((left, right) => right.z - left.z)
      .find((icon) => {
        const dx = point.x - icon.x
        const dy = point.y - icon.y
        return dx * dx + dy * dy <= icon.radius * icon.radius
      })

    targetRotationRef.current = null
    isDraggingRef.current = true
    pointerGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      hitIconId: hitIcon?.id ?? null,
      hasDragged: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    requestDrawRef.current()
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = getPointerPosition(event)
    pointerRef.current = { ...point, hasMoved: true }

    const gesture = pointerGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const distance = Math.hypot(
      event.clientX - gesture.startX,
      event.clientY - gesture.startY,
    )

    if (!gesture.hasDragged && distance < 6) return

    gesture.hasDragged = true
    const deltaX = event.clientX - gesture.lastX
    const deltaY = event.clientY - gesture.lastY
    rotationRef.current.x += deltaY * 0.004
    rotationRef.current.y += deltaX * 0.004
    gesture.lastX = event.clientX
    gesture.lastY = event.clientY
    requestDrawRef.current()
  }

  function finishPointerGesture(
    event: React.PointerEvent<HTMLCanvasElement>,
    shouldFocusIcon: boolean,
  ) {
    const gesture = pointerGestureRef.current
    pointerGestureRef.current = null
    isDraggingRef.current = false

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (
      shouldFocusIcon
      && gesture?.pointerId === event.pointerId
      && !gesture.hasDragged
      && gesture.hitIconId !== null
    ) {
      focusIcon(gesture.hitIconId)
      return
    }

    requestDrawRef.current()
  }

  function handleLostPointerCapture(event: React.PointerEvent<HTMLCanvasElement>) {
    if (pointerGestureRef.current?.pointerId === event.pointerId) {
      pointerGestureRef.current = null
      isDraggingRef.current = false
      requestDrawRef.current()
    }
  }

  return (
    <div className={cn('relative aspect-square w-full max-w-[480px]', className)}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointerGesture(event, true)}
        onPointerCancel={(event) => finishPointerGesture(event, false)}
        onLostPointerCapture={handleLostPointerCapture}
        className="block aspect-square h-auto w-full touch-pan-y select-none"
        aria-hidden="true"
      />

      {showControl && (
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={isPaused ? '播放图标球动画' : '暂停图标球动画'}
          title={isPaused ? '播放动画' : '暂停动画'}
        >
          {isPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      )}
    </div>
  )
}

export default IconCloud
