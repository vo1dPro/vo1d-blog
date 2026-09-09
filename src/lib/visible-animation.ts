/** Keep one animation loop while visible, preserving animation time across pauses. */
export function animateWhileVisible(element: Element, draw: (elapsedSeconds: number) => void) {
  let visible = false
  let disposed = false
  let frame: number | null = null
  let previousTime: number | null = null
  let elapsed = 0

  function tick(time: number) {
    frame = null
    if (disposed || !visible || document.hidden) return
    if (previousTime !== null) elapsed += Math.min(time - previousTime, 100) / 1000
    previousTime = time
    draw(elapsed)
    frame = requestAnimationFrame(tick)
  }

  function update() {
    if (!disposed && visible && !document.hidden) {
      if (frame === null) frame = requestAnimationFrame(tick)
    } else {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      previousTime = null
    }
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    update()
  })
  observer.observe(element)
  document.addEventListener('visibilitychange', update)
  return () => {
    disposed = true
    observer.disconnect()
    document.removeEventListener('visibilitychange', update)
    update()
  }
}
