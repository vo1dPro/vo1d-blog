interface SectionTitleProps {
  title: string
  subtitle?: string
}

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}
