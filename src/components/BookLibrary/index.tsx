import { useMemo, useState } from 'react'
import { ArrowDownUp, ChevronDown, Search, X } from 'lucide-react'
import type { Book } from '@/types'
import './index.css'

interface BookLibraryProps {
  books: Book[]
}

export default function BookLibrary({ books }: BookLibraryProps) {
  const [query, setQuery] = useState('')
  const [sortAscending, setSortAscending] = useState(true)

  const orderedBooks = useMemo(
    () => [...books].sort((a, b) => a.readingOrder - b.readingOrder),
    [books],
  )

  const visibleBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
    const result = normalizedQuery
      ? books.filter((book) =>
          `${book.title} ${book.author}`.toLocaleLowerCase('zh-CN').includes(normalizedQuery),
        )
      : [...books]

    return result.sort((a, b) => {
      const difference = a.readingOrder - b.readingOrder
      return sortAscending ? difference : -difference
    })
  }, [books, query, sortAscending])

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
          {orderedBooks.map((book) => (
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
            <button
              type="button"
              className="book-library__sort"
              onClick={() => setSortAscending((current) => !current)}
              aria-label={`切换为阅读顺序${sortAscending ? '倒序' : '正序'}`}
            >
              <ArrowDownUp size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>{sortAscending ? '阅读顺序' : '最近阅读'}</span>
            </button>

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
                const progress = Math.min(100, Math.max(0, book.progress))

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
