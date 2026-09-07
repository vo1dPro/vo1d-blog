import { useCallback, useRef, useState } from 'react'

import type { Photo } from '@/types'
import { usePublicCollection, type PublicPhoto } from '@/lib/public-content'
import { ContentStatus } from '../ContentStatus'
import ContentImage from '../ContentImage'
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
      <ContentImage
        src={photo.thumbnailSrc}
        alt={photo.alt}
        width={720}
        height={480}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover"
      />

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
  const content = usePublicCollection<PublicPhoto>('photos')
  const photos = (content.data ?? []).map((photo) => ({ ...photo, src: photo.original.url, thumbnailSrc: photo.thumbnail.url }))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selectedPhoto = photos.find((photo) => photo.id === selectedId) ?? null
  // Reconcile during render so a withdrawn photo never survives in the dialog.
  if (selectedId !== null && content.data !== null && !selectedPhoto) setSelectedId(null)
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
    setSelectedId(photo.id)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedId(null)
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
        <ContentStatus error={content.error} loading={content.data === null} empty={content.data?.length === 0} retry={content.retry} />
        {photos.length > 0 && <ScrollVelocityContainer className="w-full">
          <ScrollVelocityRow
            baseVelocity={6}
            direction={1}
            pauseOnHover
            paused={isDialogPresent}
            className="py-2 sm:py-3"
          >
            {photos.filter((_, index) => index % 2 === 0).map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onSelect={handleSelect} />
            ))}
          </ScrollVelocityRow>

          {photos.length > 1 && <ScrollVelocityRow
            baseVelocity={6}
            direction={-1}
            pauseOnHover
            paused={isDialogPresent}
            className="py-2 sm:py-3"
          >
            {photos.filter((_, index) => index % 2 === 1).map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onSelect={handleSelect} />
            ))}
          </ScrollVelocityRow>}
        </ScrollVelocityContainer>}

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
