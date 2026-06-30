import { useEffect, useRef, useState } from 'react'

interface Icon {
  x: number
  y: number
  z: number
  id: number
}

interface IconCloudProps {
  images?: string[]
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

export default function IconCloud({ images = [] }: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [iconPositions, setIconPositions] = useState<Icon[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [targetRotation, setTargetRotation] = useState<{
    x: number
    y: number
    startX: number
    startY: number
    startTime: number
    duration: number
  } | null>(null)
  const animationFrameRef = useRef(0)
  const rotationRef = useRef({ x: 0, y: 0 })
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([])
  const imagesLoadedRef = useRef<boolean[]>([])

  useEffect(() => {
    imagesLoadedRef.current = new Array(images.length).fill(false)

    iconCanvasesRef.current = images.map((src, index) => {
      const offscreen = document.createElement('canvas')
      offscreen.width = 40
      offscreen.height = 40
      const context = offscreen.getContext('2d')

      if (context) {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.src = src
        image.onload = () => {
          context.clearRect(0, 0, offscreen.width, offscreen.height)
          context.beginPath()
          context.arc(20, 20, 20, 0, Math.PI * 2)
          context.closePath()
          context.clip()
          context.fillStyle = '#fff'
          context.fillRect(0, 0, 40, 40)
          context.drawImage(image, 6, 6, 28, 28)
          imagesLoadedRef.current[index] = true
        }
      }

      return offscreen
    })
  }, [images])

  useEffect(() => {
    const numIcons = images.length || 20
    const offset = 2 / numIcons
    const increment = Math.PI * (3 - Math.sqrt(5))
    const nextIcons: Icon[] = []

    for (let index = 0; index < numIcons; index += 1) {
      const y = index * offset - 1 + offset / 2
      const radius = Math.sqrt(1 - y * y)
      const phi = index * increment

      nextIcons.push({
        x: Math.cos(phi) * radius * 112,
        y: y * 112,
        z: Math.sin(phi) * radius * 112,
        id: index,
      })
    }

    setIconPositions(nextIcons)
  }, [images])

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const rect = canvas?.getBoundingClientRect()
    if (!canvas || !rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    for (const icon of iconPositions) {
      const cosX = Math.cos(rotationRef.current.x)
      const sinX = Math.sin(rotationRef.current.x)
      const cosY = Math.cos(rotationRef.current.y)
      const sinY = Math.sin(rotationRef.current.y)
      const rotatedX = icon.x * cosY - icon.z * sinY
      const rotatedZ = icon.x * sinY + icon.z * cosY
      const rotatedY = icon.y * cosX + rotatedZ * sinX
      const screenX = canvas.width / 2 + rotatedX
      const screenY = canvas.height / 2 + rotatedY
      const scale = (rotatedZ + 220) / 340
      const radius = 22 * scale
      const dx = x - screenX
      const dy = y - screenY

      if (dx * dx + dy * dy < radius * radius) {
        const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z))
        const targetY = Math.atan2(icon.x, icon.z)
        const currentX = rotationRef.current.x
        const currentY = rotationRef.current.y
        const distance = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2)

        setTargetRotation({
          x: targetX,
          y: targetY,
          startX: currentX,
          startY: currentY,
          startTime: performance.now(),
          duration: Math.min(2000, Math.max(800, distance * 1000)),
        })
        return
      }
    }

    setIsDragging(true)
    setLastMousePos({ x: event.clientX, y: event.clientY })
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    if (isDragging) {
      const deltaX = event.clientX - lastMousePos.x
      const deltaY = event.clientY - lastMousePos.y
      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      }
      setLastMousePos({ x: event.clientX, y: event.clientY })
    }
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
      const dx = mousePos.x - centerX
      const dy = mousePos.y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const speed = 0.003 + (distance / maxDistance) * 0.01

      if (targetRotation) {
        const elapsed = performance.now() - targetRotation.startTime
        const progress = Math.min(1, elapsed / targetRotation.duration)
        const easedProgress = easeOutCubic(progress)
        rotationRef.current = {
          x: targetRotation.startX + (targetRotation.x - targetRotation.startX) * easedProgress,
          y: targetRotation.startY + (targetRotation.y - targetRotation.startY) * easedProgress,
        }
        if (progress >= 1) setTargetRotation(null)
      } else if (!isDragging) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / canvas.height) * speed,
          y: rotationRef.current.y + (dx / canvas.width) * speed,
        }
      }

      iconPositions.forEach((icon, index) => {
        const cosX = Math.cos(rotationRef.current.x)
        const sinX = Math.sin(rotationRef.current.x)
        const cosY = Math.cos(rotationRef.current.y)
        const sinY = Math.sin(rotationRef.current.y)
        const rotatedX = icon.x * cosY - icon.z * sinY
        const rotatedZ = icon.x * sinY + icon.z * cosY
        const rotatedY = icon.y * cosX + rotatedZ * sinX
        const scale = (rotatedZ + 220) / 340
        const opacity = Math.max(0.25, Math.min(1, (rotatedZ + 170) / 240))

        context.save()
        context.translate(canvas.width / 2 + rotatedX, canvas.height / 2 + rotatedY)
        context.scale(scale, scale)
        context.globalAlpha = opacity

        if (iconCanvasesRef.current[index] && imagesLoadedRef.current[index]) {
          context.shadowColor = 'rgba(0, 0, 0, 0.18)'
          context.shadowBlur = 10
          context.drawImage(iconCanvasesRef.current[index], -20, -20, 40, 40)
        }

        context.restore()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [iconPositions, images, isDragging, mousePos, targetRotation])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="h-full w-full max-w-[400px] rounded-lg"
      aria-label="Interactive 3D Icon Cloud"
      role="img"
    />
  )
}
