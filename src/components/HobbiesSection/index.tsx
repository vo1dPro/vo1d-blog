import { useState } from 'react'
import SectionTitle from '../SectionTitle'
import { BookOpen, Gamepad2, Camera, ChevronRight } from 'lucide-react'
import GameMusicPlayer from '../GameMusicPlayer'
import UnderConstructionTape from '../UnderConstructionTape'
import { games } from '../../data/games'
import { photos } from '../../data/photos'

export default function HobbiesSection() {
  const [showPhotos, setShowPhotos] = useState(false)

  return (
    <section id="hobbies" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle title="Hobbies" subtitle="Things I enjoy outside of code" />

        {/* Books — placeholder */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Books</h3>
          </div>
          <div className="unfinished-module relative rounded-xl bg-card border border-border p-12 text-center overflow-visible">
            <UnderConstructionTape />
            <BookOpen size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Coming soon...</p>
          </div>
        </div>

        {/* Games — Music Player */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Games</h3>
          </div>

          <GameMusicPlayer games={games} />
        </div>

        {/* Photos */}
        <div>
          <button
            className="flex items-center gap-2 mb-5 group"
            onClick={() => setShowPhotos(v => !v)}
          >
            <Camera size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Photos</h3>
            <ChevronRight
              size={16}
              className={`text-muted-foreground transition-transform duration-200 ${showPhotos ? 'rotate-90' : ''}`}
            />
          </button>

          {showPhotos && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border group"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-xs text-white truncate">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
