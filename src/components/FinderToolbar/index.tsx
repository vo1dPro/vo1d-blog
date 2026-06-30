import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Grid3X3, List, Search } from 'lucide-react'

interface FinderToolbarProps {
  viewMode: 'list' | 'grid'
  search: string
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  onSearchChange: (value: string) => void
  onViewModeChange: (mode: 'list' | 'grid') => void
}

export default function FinderToolbar({
  viewMode,
  search,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onSearchChange,
  onViewModeChange,
}: FinderToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  function closeSearchIfEmpty() {
    if (!search.trim()) setSearchOpen(false)
  }

  return (
    <div
      className="flex h-11 items-stretch bg-[#F5F5F7] rounded-t-xl"
    >
      <div className="flex w-24 shrink-0 items-center px-4 md:w-48 md:border-r md:border-[#D1D1D6]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[#E0443E] bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full border border-[#DEA123] bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full border border-[#1AAB29] bg-[#28C840]" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center border-b border-[#D1D1D6] px-3">
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#1D1D1F] transition-colors hover:bg-[#E8E8ED] disabled:text-[#B6B6BB] disabled:hover:bg-transparent"
            disabled={!canGoBack}
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={20} strokeWidth={1.85} />
          </button>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#1D1D1F] transition-colors hover:bg-[#E8E8ED] disabled:text-[#B6B6BB] disabled:hover:bg-transparent"
            disabled={!canGoForward}
            onClick={onForward}
            aria-label="Forward"
          >
            <ChevronRight size={20} strokeWidth={1.85} />
          </button>
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div
          className="mr-2 flex h-8 items-center rounded-md bg-[#EDEDF0] p-0.5"
        >
          <button
            className={`inline-flex h-7 w-8 items-center justify-center rounded-[5px] transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grid view"
          >
            <Grid3X3 size={16} strokeWidth={1.8} />
          </button>
          <button
            className={`inline-flex h-7 w-8 items-center justify-center rounded-[5px] transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-[#1D1D1F] shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
          >
            <List size={17} strokeWidth={1.9} />
          </button>
        </div>

        {/* Search */}
        <div className="flex h-8 items-center justify-end">
          {searchOpen ? (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[#6E6E73]"
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search"
                value={search}
                onBlur={closeSearchIfEmpty}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-7 w-36 rounded-md border border-[#D1D1D6] bg-white pl-7 pr-2 text-xs text-[#1D1D1F] outline-none transition-all placeholder:text-[#AEAEB2] focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/30 sm:w-44"
              />
            </div>
          ) : (
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6E6E73] hover:bg-[#E8E8ED] hover:text-[#1D1D1F] transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
