import { useState } from 'react'
import SectionTitle, { SectionSubtitle } from '../SectionTitle'
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
        <SectionTitle index="03" title="Hobbies" />

        <div className="mb-14">
          <SectionSubtitle label="Books" count={books.status === 'success' ? books.data.length : undefined} />

          <QueryContent query={books} label="books" isEmpty={items => items.length === 0}>
            {items => <BookLibrary books={items} />}
          </QueryContent>
        </div>

        <div className="mb-14">
          <SectionSubtitle label="Games" count={games.status === 'success' ? games.data.length : undefined} />

          <QueryContent query={games} label="games" isEmpty={items => items.length === 0}>
            {items => <GameMusicPlayer games={items} />}
          </QueryContent>
        </div>

        <div>
          <SectionSubtitle
            label="Photos"
            expanded={showPhotos}
            controls="photo-gallery"
            onToggle={() => setShowPhotos(v => !v)}
          />

          {showPhotos && (
            <PhotoVelocityGallery />
          )}
        </div>
      </div>
    </section>
  )
}
