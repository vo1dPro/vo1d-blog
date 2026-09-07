import { useCallback, useRef, useState } from 'react'

import type { Photo } from '@/types'
import { getPhotos } from '@/services/photos'
import { usePublicQuery } from '@/hooks/usePublicQuery'
import QueryContent from '@/components/QueryContent'
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from '@/registry/magicui/scroll-based-velocity'
import { useScrollVelocityCopyIndex } from '@/registry/magicui/scroll-velocity-copy-context'
import PhotoDetailDialog from '@/components/PhotoDetailDialog'

interface PhotoCardProps {
  photo: Photo
  onSelect: (photo: Photo, trigger: HTMLButtonElement) => void
}

function PhotoCard({ photo, onSelect }: PhotoCardProps) {
  const [failed, setFailed] = useState(false)
  const copyIndex = useScrollVelocityCopyIndex()
  const isAccessibleCopy = copyIndex === 0

  return (
    <button
      type="button"
      data-photo-id={photo.id}
      tabIndex={isAccessibleCopy ? 0 : -1}
      aria-label={`Open details for ${photo.title}`}
      onPointerDown={(event) => {
        if (!isAccessibleCopy) {
          event.preventDefault()
        }
      }}
      onClick={(event) => onSelect(photo, event.currentTarget)}
      className="group relative mx-2 inline-block h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-border bg-card p-0 align-middle text-left shadow-sm transition-[border-color,box-shadow,opacity] duration-200 hover:border-primary/45 hover:shadow-md active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mx-4 sm:h-40 sm:w-60"
    >
      {failed ? <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Image unavailable</span> : <img
        src={photo.thumbnailSrc}
        alt={photo.alt}
        width={720}
        height={480}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />}

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
        <span className="block truncate">{photo.title}</span>
      </span>
    </button>
  )
}

function isFullyVisibleWithin(element: HTMLElement, container: HTMLElement) {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return elementRect.width > 0
    && elementRect.height > 0
    && elementRect.left >= containerRect.left
    && elementRect.right <= containerRect.right
    && elementRect.top >= containerRect.top
    && elementRect.bottom <= containerRect.bottom
}

export default function PhotoVelocityGallery() {
  const photos = usePublicQuery(getPhotos)
  if (photos.status !== 'success' || photos.data.length === 0) return <div id="photo-gallery">
    <QueryContent query={photos} label="photos" isEmpty={items => items.length === 0}>{() => null}</QueryContent>
  </div>
  return <QueryContent query={photos} label="photos" isEmpty={items => items.length === 0}>
    {items => <PhotoGallery photos={items} />}
  </QueryContent>
}

function PhotoGallery({ photos }: { photos: Photo[] }) {
  const PHOTOS_ROW_A = photos.filter((_, index) => index % 2 === 0)
  const PHOTOS_ROW_B = photos.filter((_, index) => index % 2 === 1)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isDialogPresent, setIsDialogPresent] = useState(false)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const handleSelect = useCallback((photo: Photo, trigger: HTMLButtonElement) => {
    const gallery = document.getElementById('photo-gallery')
    const canonicalTrigger = document.querySelector<HTMLButtonElement>(
      `#photo-gallery [aria-hidden="false"] [data-photo-id="${photo.id}"]`,
    )

    returnFocusRef.current = canonicalTrigger && gallery
      && isFullyVisibleWithin(canonicalTrigger, gallery)
      ? canonicalTrigger
      : gallery ?? trigger
    setIsDialogPresent(true)
    setSelectedPhoto(photo)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedPhoto(null)
  }, [])

  const handleDialogExitComplete = useCallback(() => {
    setIsDialogPresent(false)
  }, [])

  return (
    <>
      <div
        id="photo-gallery"
        role="region"
        aria-label="Photo gallery"
        tabIndex={-1}
        className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden py-3 outline-none"
      >
        <ScrollVelocityContainer className="w-full">
          <ScrollVelocityRow
            baseVelocity={6}
            direction={1}
            pauseOnHover
            paused={isDialogPresent}
            className="py-2 sm:py-3"
          >
            {PHOTOS_ROW_A.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onSelect={handleSelect} />
            ))}
          </ScrollVelocityRow>

          <ScrollVelocityRow
            baseVelocity={6}
            direction={-1}
            pauseOnHover
            paused={isDialogPresent}
            className="py-2 sm:py-3"
          >
            {PHOTOS_ROW_B.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onSelect={handleSelect} />
            ))}
          </ScrollVelocityRow>
        </ScrollVelocityContainer>

        <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r to-transparent sm:w-20 lg:w-28" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l to-transparent sm:w-20 lg:w-28" />
      </div>

      <PhotoDetailDialog
        photo={selectedPhoto}
        onClose={handleClose}
        onExitComplete={handleDialogExitComplete}
        returnFocusRef={returnFocusRef}
      />
    </>
  )
}
