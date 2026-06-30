import { UserRound } from 'lucide-react'

const tocItems = [
  { href: '#overview', label: 'Overview' },
  { href: '#key-notes', label: 'Key Notes' },
  { href: '#details', label: 'Details' },
  { href: '#conclusion', label: 'Conclusion' },
]

export default function BlogPostSidebar() {
  return (
    <aside className="hidden w-[350px] shrink-0 bg-muted/60 p-6 dark:bg-muted/20 lg:block lg:p-10">
      <div className="sticky top-24 space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            <UserRound size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">vo1d</p>
            <p className="text-xs text-muted-foreground">Developer</p>
          </div>
        </div>

        <nav className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm font-semibold text-foreground">On this page</p>
          <div className="space-y-3">
            {tocItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  )
}
