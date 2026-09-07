import { allPages } from '../client'
import type { Book, BookResponse } from './model'

export async function getBooks(signal: AbortSignal): Promise<Book[]> {
  return (await allPages<BookResponse>('/books', signal)).map(book => ({
    ...book, cover: book.cover.url, readingTime: book.lastReadAt,
  }))
}
