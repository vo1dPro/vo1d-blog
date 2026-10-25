import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

interface Options {
  phone: HTMLElement; port: HTMLElement; layer: HTMLElement
  canvas: HTMLCanvasElement; grab: HTMLButtonElement
  onChargingChange: (value: boolean) => void
  onStatus: (value: string) => void
}
type State = 'idle' | 'dragging' | 'connected'

function disposeModel(...roots: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
  roots.forEach(root => root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
  }))
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
}

export function mountCable({ phone, port, layer, canvas, grab, onChargingChange, onStatus }: Options) {
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }) }
  catch { onStatus('浏览器暂不支持充电线的 3D 显示。'); return () => {} }
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera()
  camera.position.z = 800
  const generator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
  const environment = generator.fromScene(room, .04)
  scene.environment = environment.texture; scene.environmentIntensity = .65
  room.dispose(); generator.dispose()
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1
  renderer.localClippingEnabled = true; renderer.setClearColor(0, 0)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6c7466, 1.3))
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(-200, 350, 500); scene.add(key)
  const rim = new THREE.DirectionalLight(0xdae7ff, 1); rim.position.set(400, -100, 250); scene.add(rim)
  const material = new THREE.MeshStandardMaterial({ color: 0xf1f0e8, roughness: .55 })
  const cable = new THREE.Mesh(new THREE.BufferGeometry(), material); scene.add(cable)
  const connector = new THREE.Group(); scene.add(connector)
  const clipping = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const events = new AbortController()
  let disposed = false, loaded = false, source: THREE.Object3D | undefined
  let width = innerWidth, height = innerHeight, state: State = 'idle'
  const dock = () => {
    const rect = phone.getBoundingClientRect()
    return { x: width + 38, y: rect.bottom + 60 }
  }
  let previousDock = dock()
  let point = dock(), velocity = { x: 0, y: 0 }
  let angle = -Math.PI / 2, sag = 0, frame = 0, lastFrame = 0
  let cableShapeKey = ''
  let pointer: number | null = null, offset = { x: 0, y: 0 }, lastMove = 0
  // Seat the housing against the phone edge so the entire metal tip is inside.
  const insertionOffset = 17
  const target = () => { const r = port.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + insertionOffset } }
  const distance = () => { const p = target(); return Math.hypot(point.x - p.x, point.y - p.y) }
  const world = (x: number, y: number) => new THREE.Vector3(x - width / 2, height / 2 - y, 0)
  const visible = () => { const r = phone.getBoundingClientRect(); return !document.hidden && r.bottom + 90 > 0 && r.top < height }
  function wake() {
    if (disposed || !loaded || !visible()) return
    layer.hidden = false
    if (!frame) { lastFrame = performance.now(); frame = requestAnimationFrame(tick) }
  }
  function setState(next: State) {
    const wasConnected = state === 'connected'; state = next
    if (wasConnected !== (next === 'connected')) onChargingChange(next === 'connected')
    onStatus(next === 'connected' ? '正在充电，拖动插头可拔出。' : '将插头拖到手机底部，松手连接。')
    grab.setAttribute('aria-pressed', String(next === 'connected'))
    wake()
  }
  function cancel() {
    const id = pointer; pointer = null
    if (id !== null && grab.hasPointerCapture(id)) grab.releasePointerCapture(id)
    velocity = { x: 0, y: 0 }; setState('idle')
  }
  function sync() {
    if (!visible()) {
      // Going offscreen or switching tabs must not unplug a connected cable.
      if (state === 'dragging') cancel()
      layer.hidden = true; cancelAnimationFrame(frame); frame = 0
      if (state === 'idle') point = dock()
      previousDock = dock()
      return
    }
    wake()
  }
  function resize() {
    width = innerWidth; height = innerHeight; renderer.setSize(width, height, false)
    camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2
    camera.near = .1; camera.far = 2000; camera.updateProjectionMatrix()
    if (state === 'idle') point = dock()
    previousDock = dock()
    sync()
  }
  function tick(now: number) {
    frame = 0
    if (disposed || !visible()) { sync(); return }
    const dt = Math.min((now - lastFrame) / 1000 || 1 / 60, 1 / 30); lastFrame = now
    const currentDock = dock()
    // Carry the parked/returning cable with the phone, without scroll inertia.
    if (state === 'idle') {
      point.x += currentDock.x - previousDock.x
      point.y += currentDock.y - previousDock.y
    }
    previousDock = currentDock
    const desired = state === 'connected' ? target() : currentDock
    if (state !== 'dragging') {
      if (reduced.matches || state === 'connected') { point = desired; velocity = { x: 0, y: 0 } }
      else for (const axis of ['x', 'y'] as const) { velocity[axis] += (desired[axis] - point[axis]) * 180 * dt - velocity[axis] * 25 * dt; point[axis] += velocity[axis] * dt }
    }
    const alignment = state === 'connected' ? 1 : state === 'dragging' ? 1 - THREE.MathUtils.smoothstep(distance(), 48, 110) : 0
    const wantAngle = -Math.PI / 2 * (1 - alignment)
    angle = reduced.matches || state === 'connected' ? wantAngle : THREE.MathUtils.lerp(angle, wantAngle, 1 - Math.exp(-14 * dt))
    connector.position.copy(world(point.x, point.y)); connector.rotation.set(.22, .08, angle)
    clipping.constant = height / 2 - (target().y - insertionOffset)
    connector.traverse(object => {
      if (object instanceof THREE.Mesh) for (const mat of Array.isArray(object.material) ? object.material : [object.material]) mat.clippingPlanes = state === 'connected' ? [clipping] : []
    })
    connector.updateMatrixWorld(true)
    const tail = connector.localToWorld(new THREE.Vector3(0, -28, 0))
    const backward = new THREE.Vector3(0, -1, 0).transformDirection(connector.matrixWorld)
    const desiredSag = Math.min(40, Math.max(0, (currentDock.x - point.x) * .06))
    sag = reduced.matches ? desiredSag : THREE.MathUtils.lerp(sag, desiredSag, 1 - Math.exp(-9 * dt))
    // The left end stays outside; the right plug retracts past the viewport to form a divider.
    const start = world(-70, currentDock.y), first = start.clone().lerp(tail, .35); first.y -= sag
    const second = tail.clone().addScaledVector(backward, Math.min(110, Math.max(8, (tail.x - start.x) * .32)))
    const controls = [start, first, second, tail]
    const shapeKey = controls.flatMap(p => [p.x, p.y, p.z]).map(value => value.toFixed(2)).join(',')
    if (shapeKey !== cableShapeKey) {
      const curve = new THREE.CubicBezierCurve3(start, first, second, tail)
      curve.arcLengthDivisions = 1024
      const controlLength = controls.slice(1).reduce((length, p, i) => {
        const previous = controls[i]
        return length + Math.hypot(p.x - previous.x, p.y - previous.y, p.z - previous.z)
      }, 0)
      // Short screen-space segments keep the tight bend smooth even on wide screens.
      const segments = THREE.MathUtils.clamp(Math.ceil(controlLength / 2.5), 96, 640)
      const old = cable.geometry
      cable.geometry = new THREE.TubeGeometry(curve, segments, 3.1, 16, false)
      old.dispose()
      cableShapeKey = shapeKey
    }
    // Keep a generous hit area inside the right edge while the connector is hidden.
    grab.style.left = `${Math.min(point.x - 32, width - 48)}px`; grab.style.top = `${point.y - 40}px`
    renderer.render(scene, camera)
    if (state === 'connected' || state === 'dragging' || Math.hypot(desired.x - point.x, desired.y - point.y) > .05 || Math.hypot(velocity.x, velocity.y) > .1 || Math.abs(angle - wantAngle) > .001 || Math.abs(sag - desiredSag) > .05) frame = requestAnimationFrame(tick)
  }
  grab.addEventListener('pointerdown', e => {
    if (pointer !== null || e.button !== 0) return
    pointer = e.pointerId; grab.setPointerCapture(pointer); offset = { x: e.clientX - point.x, y: e.clientY - point.y }
    lastMove = performance.now(); velocity = { x: 0, y: 0 }; setState('dragging')
  }, { signal: events.signal })
  grab.addEventListener('pointermove', e => {
    if (e.pointerId !== pointer) return
    const now = performance.now(), dt = Math.max((now - lastMove) / 1000, .008)
    const next = { x: THREE.MathUtils.clamp(e.clientX - offset.x, 12, width + 38), y: THREE.MathUtils.clamp(e.clientY - offset.y, 40, height - 35) }
    velocity = { x: THREE.MathUtils.clamp((next.x - point.x) / dt, -1000, 1000), y: THREE.MathUtils.clamp((next.y - point.y) / dt, -1000, 1000) }
    point = next; lastMove = now; wake()
  }, { signal: events.signal })
  grab.addEventListener('pointerup', e => { if (e.pointerId !== pointer) return; pointer = null; setState(distance() < 48 ? 'connected' : 'idle'); grab.releasePointerCapture(e.pointerId) }, { signal: events.signal })
  grab.addEventListener('pointercancel', cancel, { signal: events.signal })
  grab.addEventListener('lostpointercapture', () => { if (pointer !== null) cancel() }, { signal: events.signal })
  grab.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const next = state === 'connected' ? 'idle' : 'connected'; cancel(); setState(next) }
    else if (e.key === 'Escape') cancel()
  }, { signal: events.signal })
  window.addEventListener('resize', resize, { signal: events.signal })
  window.addEventListener('scroll', sync, { passive: true, signal: events.signal })
  document.addEventListener('visibilitychange', sync, { signal: events.signal })
  reduced.addEventListener('change', wake, { signal: events.signal })
  const observer = new ResizeObserver(sync); observer.observe(phone)
  resize()
  void new GLTFLoader().loadAsync('/models/usb-c-cable.glb').then(asset => {
    if (disposed) { disposeModel(asset.scene); return }
    source = asset.scene
    const extracted = source.getObjectByName('Cube036_4') ?? source.getObjectByName('Cube.036_4')
    if (!extracted) throw new Error('Missing connector assembly')
    extracted.position.set(0, 0, 0); extracted.quaternion.identity(); extracted.scale.setScalar(180); extracted.rotation.set(Math.PI / 2, 0, 0)
    const orientation = new THREE.Group(); orientation.rotation.z = Math.PI / 2; orientation.add(extracted); connector.add(orientation)
    loaded = true; grab.disabled = false; layer.dataset.loaded = 'true'; sync()
  }).catch(() => { if (!disposed) { layer.hidden = true; onStatus('充电线模型暂时无法加载，请刷新重试。') } })
  return () => {
    disposed = true; events.abort(); observer.disconnect(); cancelAnimationFrame(frame)
    layer.hidden = true
    disposeModel(...(source ? [source, connector] : [connector]))
    cable.geometry.dispose(); material.dispose(); environment.dispose(); renderer.dispose()
  }
}
