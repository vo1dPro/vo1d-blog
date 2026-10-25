import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import './index.css'

interface Props {
  phoneRef: RefObject<HTMLDivElement | null>
  portRef: RefObject<HTMLSpanElement | null>
  onChargingChange: (charging: boolean) => void
}

export default function ChargingCable({ phoneRef, portRef, onChargingChange }: Props) {
  const layerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grabRef = useRef<HTMLButtonElement>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const phone = phoneRef.current, port = portRef.current
    const layer = layerRef.current, canvas = canvasRef.current, grab = grabRef.current
    if (!phone || !port || !layer || !canvas || !grab) return
    let cancelled = false
    let cleanup: (() => void) | undefined
    // Delay loading Three.js and the asset until the actual phone enters view.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      void import('./runtime').then(({ mountCable }) => {
        if (cancelled) return
        cleanup = mountCable({ phone, port, layer, canvas, grab, onChargingChange, onStatus: setStatus })
      }).catch(() => { if (!cancelled) setStatus('充电线暂时无法加载，请刷新重试。') })
    })
    observer.observe(phone)
    return () => { cancelled = true; observer.disconnect(); cleanup?.() }
  }, [phoneRef, portRef, onChargingChange])

  return createPortal(<div ref={layerRef} className="game-cable-layer" hidden>
    <canvas ref={canvasRef} aria-hidden="true" />
    <button ref={grabRef} className="game-cable-grab" type="button" disabled
      aria-label="从分界线右端拉出充电线；Enter 连接或拔出，Escape 收回"
      title="拉一下试试" data-lenis-prevent />
    <span className="game-cable-status" role="status">{status}</span>
  </div>, document.body)
}
