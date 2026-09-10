import { useEffect, useRef, useState } from 'react'

interface TypingAnimationProps {
  children: string
  duration?: number
  deleteSpeed?: number
  pauseDelay?: number
}

// Keep the current text mounted so each new value erases the previous one first.
export default function TypingAnimation({
  children,
  duration = 120,
  deleteSpeed = 80,
  pauseDelay = 100,
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('')
  const textRef = useRef('')

  useEffect(() => {
    let deleting = textRef.current.length > 0
    let timer: number

    const tick = () => {
      const nextText = deleting
        ? textRef.current.slice(0, -1)
        : children.slice(0, textRef.current.length + 1)
      textRef.current = nextText
      setDisplayedText(nextText)

      if (deleting && nextText.length === 0) {
        deleting = false
        timer = window.setTimeout(tick, pauseDelay + duration)
      } else if (deleting || nextText !== children) {
        timer = window.setTimeout(tick, deleting ? deleteSpeed : duration)
      }
    }

    timer = window.setTimeout(tick, deleting ? deleteSpeed : duration)
    return () => window.clearTimeout(timer)
  }, [children, duration, deleteSpeed, pauseDelay])

  return (
    <span className="opening-typing" data-typing={displayedText !== children}>
      <span>{displayedText}</span>
      <span className="opening-typing-cursor" aria-hidden="true" />
    </span>
  )
}
