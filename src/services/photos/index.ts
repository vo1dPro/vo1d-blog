import { allPages } from '../client'
import type { Photo, PhotoResponse } from './model'

export async function getPhotos(signal: AbortSignal): Promise<Photo[]> {
  return (await allPages<PhotoResponse>('/photos', signal)).map(photo => ({
    ...photo, src: photo.original.url, thumbnailSrc: photo.thumbnail.url,
  }))
}
