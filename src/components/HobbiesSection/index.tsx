import { useState } from 'react'
import SectionTitle from '../SectionTitle'
import { BookOpen, Gamepad2, Camera, ChevronRight } from 'lucide-react'
import BookLibrary from '../BookLibrary'
import GameMusicPlayer from '../GameMusicPlayer'
import PhotoVelocityGallery from '../PhotoVelocityGallery'
import { getBooks } from '@/services/books'
import { getGames } from '@/services/games'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import QueryContent from '../QueryContent'

export default function HobbiesSection() {
  const [showPhotos, setShowPhotos] = useState(true)
  const books = usePublicQuery(getBooks)
  const games = usePublicQuery(getGames)

  return (
    <section id="hobbies" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle title="Hobbies" subtitle="Things I enjoy outside of code" />

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Books</h3>
          </div>

          <QueryContent query={books} label="books" isEmpty={items => items.length === 0}>
            {items => <BookLibrary books={items} />}
          </QueryContent>
        </div>

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Games</h3>
          </div>

          <QueryContent query={games} label="games" isEmpty={items => items.length === 0}>
            {items => <GameMusicPlayer games={items} />}
          </QueryContent>
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
