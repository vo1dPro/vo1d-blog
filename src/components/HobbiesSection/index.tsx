import { useState, type CSSProperties } from 'react'
import SectionTitle from '../SectionTitle'
import { BookOpen, Gamepad2, Camera, ChevronRight } from 'lucide-react'
import GameMusicPlayer from '../GameMusicPlayer'
import PhotoVelocityGallery from '../PhotoVelocityGallery'
import { books } from '../../data/books'
import { games } from '../../data/games'

export default function HobbiesSection() {
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

          <div className="books-grid">
            {books.map(book => (
              <article
                className="book-cover-card"
                key={book.id}
                style={{ '--book-accent': book.accent } as CSSProperties}
              >
                <div className="book-cover-card__stage" aria-hidden="true">
                  <span className="book-cover-card__shadow" />
                  <div className="book-cover-card__book">
                    <img className="book-cover-card__cover" src={book.cover} alt="" />
                  </div>
                </div>

                <div className="book-cover-card__info">
                  <h4>{book.title}</h4>
                  <span>{book.author}</span>
                </div>

                <a className="book-cover-card__link" href={book.sourceUrl}>
                  View on {book.sourceName}
                  <span aria-hidden="true">&#8599;</span>
                </a>
              </article>
            ))}
          </div>
        </div>

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Games</h3>
          </div>

          <GameMusicPlayer games={games} />
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
