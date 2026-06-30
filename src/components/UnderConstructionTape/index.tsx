interface UnderConstructionTapeProps {
  label?: string
}

export default function UnderConstructionTape({
  label = 'COMING SOON',
}: UnderConstructionTapeProps) {
  const repeatedLabel = Array.from({ length: 8 }, () => label).join('   ')

  return (
    <div className="under-construction-tape" aria-hidden="true">
      <div className="under-construction-tape__strip under-construction-tape__strip--one">
        <span>{repeatedLabel}</span>
      </div>
      <div className="under-construction-tape__strip under-construction-tape__strip--two">
        <span>{repeatedLabel}</span>
      </div>
    </div>
  )
}
