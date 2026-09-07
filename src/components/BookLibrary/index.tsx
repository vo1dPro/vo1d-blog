import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { ArrowDownUp, Check, ChevronDown, Search, X } from 'lucide-react'
import type { Book } from '@/types'
import './index.css'

interface BookLibraryProps {
  books: Book[]
}

type BookSortMode = 'readingOrder' | 'progress' | 'title' | 'recent'

const sortOptions: ReadonlyArray<{ value: BookSortMode; label: string }> = [
  { value: 'readingOrder', label: '阅读顺序' },
  { value: 'progress', label: '进度' },
  { value: 'title', label: '书名排序' },
  { value: 'recent', label: '最近阅读' },
]

function normalizeProgress(progress: number) {
  return Math.min(100, Math.max(0, progress))
}

function getReadingTimestamp(readingTime: string | null) {
  if (readingTime === null) return 0
  const timestamp = Date.parse(readingTime)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function compareBooks(a: Book, b: Book, sortMode: BookSortMode) {
  switch (sortMode) {
    case 'progress':
      return (
        normalizeProgress(b.progress) - normalizeProgress(a.progress) ||
        a.readingOrder - b.readingOrder
      )
    case 'title':
      return (
        a.title.localeCompare(b.title, 'zh-CN', {
          numeric: true,
          sensitivity: 'base',
        }) || a.readingOrder - b.readingOrder
      )
    case 'recent':
      return (
        getReadingTimestamp(b.readingTime) - getReadingTimestamp(a.readingTime) ||
        b.readingOrder - a.readingOrder
      )
    case 'readingOrder':
    default:
      return a.sortOrder - b.sortOrder || a.readingOrder - b.readingOrder || a.id - b.id
  }
}

export default function BookLibrary({ books }: BookLibraryProps) {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<BookSortMode>('readingOrder')
  const [sortOpen, setSortOpen] = useState(false)
  const sortControlRef = useRef<HTMLDivElement>(null)
  const sortTriggerRef = useRef<HTMLButtonElement>(null)
  const sortOptionRefs = useRef<Array<HTMLButtonElement | null>>([])

  const sortedBooks = useMemo(
    () => [...books].sort((a, b) => compareBooks(a, b, sortMode)),
    [books, sortMode],
  )

  const visibleBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
    return normalizedQuery
      ? sortedBooks.filter((book) =>
          `${book.title} ${book.author}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery),
        )
      : sortedBooks
  }, [query, sortedBooks])

  useEffect(() => {
    if (!sortOpen) {
      return
    }

    const selectedIndex = sortOptions.findIndex((option) => option.value === sortMode)
    const frameId = window.requestAnimationFrame(() => {
      sortOptionRefs.current[selectedIndex]?.focus()
    })

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!sortControlRef.current?.contains(event.target as Node)) {
        setSortOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSortOpen(false)
        sortTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      window.cancelAnimationFrame(frameId)
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [sortMode, sortOpen])

  function selectSortMode(nextSortMode: BookSortMode) {
    setSortMode(nextSortMode)
    setSortOpen(false)
    sortTriggerRef.current?.focus()
  }

  function handleSortOptionKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    optionIndex: number,
  ) {
    let nextIndex: number | undefined

    if (event.key === 'ArrowDown') {
      nextIndex = (optionIndex + 1) % sortOptions.length
    } else if (event.key === 'ArrowUp') {
      nextIndex = (optionIndex - 1 + sortOptions.length) % sortOptions.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = sortOptions.length - 1
    }

    if (nextIndex !== undefined) {
      event.preventDefault()
      sortOptionRefs.current[nextIndex]?.focus()
    }
  }

  function scrollToBook(bookId: number) {
    document.getElementById(`book-card-${bookId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }

  return (
    <div className="book-library">
      <aside className="book-library__sidebar" aria-label="书籍排序">
        <div className="book-library__sidebar-heading">
          <ChevronDown size={14} strokeWidth={1.9} aria-hidden="true" />
          <span>book</span>
        </div>

        <ul className="book-library__sort-list">
          {sortedBooks.map((book) => (
            <li className="book-library__sort-item" key={book.id}>
              <button
                type="button"
                className="book-library__sort-button"
                aria-label={`第 ${book.readingOrder} 本：${book.title}`}
                title={book.title}
                onClick={() => scrollToBook(book.id)}
              >
                <span>{book.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="book-library__catalog" aria-label="书架">
        <header className="book-library__toolbar">
          <span className="book-library__result-count">{visibleBooks.length} 个结果</span>

          <div className="book-library__toolbar-actions">
            <div
              className="book-library__sort-control"
              ref={sortControlRef}
              onBlur={(event) => {
                const nextFocusedElement = event.relatedTarget

                if (
                  !(nextFocusedElement instanceof Node) ||
                  !event.currentTarget.contains(nextFocusedElement)
                ) {
                  setSortOpen(false)
                }
              }}
            >
              <button
                ref={sortTriggerRef}
                type="button"
                className="book-library__sort"
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                aria-controls="book-library-sort-menu"
                aria-label={`排序，当前：${
                  sortOptions.find((option) => option.value === sortMode)?.label
                }`}
                onClick={() => setSortOpen((current) => !current)}
              >
                <ArrowDownUp size={16} strokeWidth={1.9} aria-hidden="true" />
                <span>排序</span>
              </button>

              {sortOpen && (
                <div
                  id="book-library-sort-menu"
                  className="book-library__sort-menu"
                  role="menu"
                  aria-label="选择排序方式"
                >
                  {sortOptions.map((option, index) => {
                    const selected = option.value === sortMode

                    return (
                      <button
                        ref={(element) => {
                          sortOptionRefs.current[index] = element
                        }}
                        type="button"
                        className="book-library__sort-option"
                        role="menuitemradio"
                        aria-checked={selected}
                        key={option.value}
                        onClick={() => selectSortMode(option.value)}
                        onKeyDown={(event) => handleSortOptionKeyDown(event, index)}
                      >
                        <span>{option.label}</span>
                        {selected && (
                          <Check size={14} strokeWidth={2} aria-hidden="true" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="book-library__search" role="search">
              <Search size={16} strokeWidth={1.9} aria-hidden="true" />
              <label className="sr-only" htmlFor="book-library-search">搜索书籍</label>
              <input
                id="book-library-search"
                type="search"
                value={query}
                placeholder="搜索"
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="清空搜索">
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="book-library__content">
          {visibleBooks.length > 0 ? (
            <div className="book-library__grid">
              {visibleBooks.map((book) => {
                const progress = normalizeProgress(book.progress)

                return (
                  <article
                    id={`book-card-${book.id}`}
                    className="book-library__card"
                    key={book.id}
                  >
                    <span className="book-library__cover-wrap">
                      <img
                        className="book-library__cover"
                        src={book.cover}
                        alt={`${book.title}封面`}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>

                    <span className="book-library__card-body">
                      <strong className="book-library__book-title" title={book.title}>
                        {book.title}
                      </strong>

                      <span className="book-library__meta-group">
                        <span className="book-library__meta-label">author</span>
                        <span className="book-library__meta-value">{book.author}</span>
                      </span>

                      <span className="book-library__meta-group book-library__progress-group">
                        <span className="book-library__meta-label">progress</span>
                        <span className="book-library__meta-value book-library__progress-value">
                          {progress}%
                        </span>
                      </span>
                    </span>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="book-library__empty">
              <Search size={28} strokeWidth={1.5} aria-hidden="true" />
              <strong>没有找到相关书籍</strong>
              <span>试试其他书名或作者</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
