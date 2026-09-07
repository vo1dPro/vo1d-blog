import { useState } from 'react'
import SectionTitle from '../SectionTitle'
import { BookOpen, Gamepad2, Camera, ChevronRight } from 'lucide-react'
import BookLibrary from '../BookLibrary'
import GameMusicPlayer from '../GameMusicPlayer'
import PhotoVelocityGallery from '../PhotoVelocityGallery'
import { usePublicCollection, type PublicGame, type PublicBook } from '@/lib/public-content'
import { ContentStatus } from '../ContentStatus'

export default function HobbiesSection() {
  const bookContent = usePublicCollection<PublicBook>('books')
  const books = (bookContent.data ?? []).map((book) => ({ ...book, cover: book.cover.url, readingTime: book.lastReadAt }))
  const content = usePublicCollection<PublicGame>('games')
  const games = (content.data ?? []).map((game) => ({ ...game, cover: game.cover.url, platform: game.platform ?? undefined, comment: game.comment ?? '', steamStale: game.steam?.stale ?? false, steamIncomplete: game.steam?.incomplete ?? false }))
  const [showPhotos, setShowPhotos] = useState(true)

  return (
    <section id="hobbies" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle title="Hobbies" subtitle="Things I enjoy outside of code" />

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Books</h3>
          </div>

          <ContentStatus error={bookContent.error} loading={bookContent.data === null} empty={bookContent.data?.length === 0} retry={bookContent.retry} />
          {bookContent.data !== null && books.length > 0 && <BookLibrary books={books} />}
        </div>

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Games</h3>
          </div>

          <ContentStatus error={content.error} loading={content.data === null} empty={content.data?.length === 0} retry={content.retry} />
          {games.length > 0 && <GameMusicPlayer games={games} />}
        </div>

        <div>
          <button
            type="button"
            className="flex items-center gap-2 mb-5 group"
            onClick={() => setShowPhotos(v => !v)}
            aria-expanded={showPhotos}
            aria-controls="photo-gallery"
          >
            <Camera size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Photos</h3>
            <ChevronRight
              size={16}
              className={`text-muted-foreground transition-transform duration-200 ${showPhotos ? 'rotate-90' : ''}`}
            />
          </button>

          {showPhotos && (
            <PhotoVelocityGallery />
          )}
        </div>
      </div>
    </section>
  )
}
