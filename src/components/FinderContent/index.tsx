import { useMemo, useState, useCallback } from 'react'
import type { Article } from '@/types'
import { FileText, Calendar, ChevronUp, ChevronDown } from 'lucide-react'

type SortKey = 'title' | 'date' | 'category'

interface FinderContentProps {
  articles: Article[]
  viewMode: 'list' | 'grid'
  onOpenArticle: (article: Article) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr || '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function FinderContent({ articles, viewMode, onOpenArticle }: FinderContentProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }, [sortKey])

  const sortedArticles = useMemo(() => {
    const list = [...articles]
    list.sort((a, b) => {
      let cmp: number
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title, 'zh')
      else if (sortKey === 'date') cmp = a.date.localeCompare(b.date)
      else cmp = a.category.localeCompare(b.category)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [articles, sortKey, sortAsc])

  if (viewMode === 'list') {
    return (
      <div className="flex-1 overflow-auto">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-2 bg-[#F5F5F7] border-b border-[#D1D1D6] text-xs text-muted-foreground font-medium sticky top-0">
          <button
            className="flex-1 flex items-center gap-1 hover:text-[#1D1D1F] transition-colors text-left"
            onClick={() => toggleSort('title')}
          >
            Name
            {sortKey === 'title' && (
              sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
            )}
          </button>
          <button
            className="hidden sm:flex w-28 items-center gap-1 hover:text-[#1D1D1F] transition-colors"
            onClick={() => toggleSort('category')}
          >
            Category
            {sortKey === 'category' && (
              sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
            )}
          </button>
          <button
            className="w-28 flex items-center gap-1 hover:text-[#1D1D1F] transition-colors"
            onClick={() => toggleSort('date')}
          >
            Date
            {sortKey === 'date' && (
              sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
            )}
          </button>
          <span className="hidden md:block w-24">Tags</span>
        </div>

        {/* Rows */}
        {sortedArticles.map((article, index) => (
          <div
            key={article.id}
            className={`flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 cursor-pointer transition-colors hover:bg-[#E8F0FE] ${
              index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
            }`}
            onClick={() => onOpenArticle(article)}
          >
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <FileText size={18} className="text-[#007AFF] shrink-0" />
              <span className="text-sm text-[#1D1D1F] truncate">{article.title}</span>
            </div>
            <div className="hidden sm:flex w-28 text-xs text-muted-foreground truncate">
              {article.category}
            </div>
            <div className="w-28 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} className="shrink-0" />
              {formatDate(article.date)}
            </div>
            <div className="hidden md:flex w-24 gap-1 flex-wrap">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-[#F5F5F7] text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {sortedArticles.length === 0 && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No articles found
          </div>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedArticles.map((article) => (
          <button
            key={article.id}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white border border-gray-100 hover:border-[#007AFF] hover:shadow-sm transition-all text-center cursor-pointer"
            onClick={() => onOpenArticle(article)}
          >
            <FileText size={36} className="text-[#007AFF]" />
            <span className="text-xs text-[#1D1D1F] font-medium leading-tight line-clamp-2">
              {article.title}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatDate(article.date)}</span>
          </button>
        ))}
      </div>

      {sortedArticles.length === 0 && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No articles found
        </div>
      )}
    </div>
  )
}
