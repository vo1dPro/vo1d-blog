import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'motion/react'
import type { SpringOptions } from 'motion/react'
import { cn } from '@/lib/utils'

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number
  startValue?: number
  direction?: 'up' | 'down'
  delay?: number
  decimalPlaces?: number
  minimumIntegerDigits?: number
  springOptions?: SpringOptions
  onValueChange?: (value: number) => void
}

// Based on Magic UI's Number Ticker, with shared progress and leading-zero support.
export default function NumberTicker({
  value,
  startValue = 0,
  direction = 'up',
  delay = 0,
  decimalPlaces = 0,
  minimumIntegerDigits = 1,
  springOptions,
  onValueChange,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [initialValue] = useState(() => direction === 'down' ? value : startValue)
  const motionValue = useMotionValue(initialValue)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100, ...springOptions })
  const isInView = useInView(ref, { once: true, margin: '0px' })
  const formatter = useMemo(() => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    minimumIntegerDigits,
    useGrouping: false,
  }), [decimalPlaces, minimumIntegerDigits])

  useEffect(() => {
    if (!isInView) return
    const timer = window.setTimeout(() => {
      motionValue.set(direction === 'down' ? startValue : value)
    }, delay * 1000)
    return () => window.clearTimeout(timer)
  }, [motionValue, isInView, delay, value, direction, startValue])

  useEffect(() => {
    const renderValue = (latest: number) => {
      if (ref.current) ref.current.textContent = formatter.format(latest)
      onValueChange?.(latest)
    }
    renderValue(springValue.get())
    return springValue.on('change', renderValue)
  }, [springValue, formatter, onValueChange])

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)} {...props}>
      {formatter.format(initialValue)}
    </span>
  )
}
