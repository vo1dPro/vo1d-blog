import type { ArticleCategory } from '@/types'
import {
  FileCode,
  Folder,
  FolderOpen,
  Globe,
  Palette,
  Server,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

interface FinderSidebarProps {
  categories: ArticleCategory[]
  activeCategory: string
  onActiveCategoryChange: (key: string) => void
}

const iconMap: Record<string, LucideIcon> = {
  Folder,
  Globe,
  Server,
  Wrench,
  FileCode,
  Palette,
}

export default function FinderSidebar({
  categories,
  activeCategory,
  onActiveCategoryChange,
}: FinderSidebarProps) {
  return (
    <aside
      className="w-full md:w-48 shrink-0 bg-[#F5F5F7] border-b md:border-b-0 md:border-r border-[#D1D1D6] overflow-x-auto md:overflow-x-visible"
    >
      {/* Mobile: horizontal scroll */}
      <div className="flex md:hidden gap-1 p-2">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Folder
          return (
            <button
              key={cat.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-[#007AFF] text-white'
                  : 'text-[#1D1D1F] hover:bg-gray-200'
              }`}
              onClick={() => onActiveCategoryChange(cat.key)}
            >
              <Icon size={14} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Desktop: vertical list */}
      <nav className="hidden md:block p-3 space-y-0.5">
        <p
          className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2"
        >
          Categories
        </p>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key
          const Icon = isActive ? FolderOpen : (iconMap[cat.icon] || Folder)
          return (
            <button
              key={cat.key}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left ${
                isActive
                  ? 'bg-[#007AFF] text-white'
                  : 'text-[#1D1D1F] hover:bg-gray-200'
              }`}
              onClick={() => onActiveCategoryChange(cat.key)}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{cat.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
