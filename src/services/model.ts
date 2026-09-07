export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Media {
  id: number
  url: string
  mimeType: string
  sizeBytes: number
  width: number
  height: number
  altText: string | null
  kind: 'IMAGE' | 'PHOTO_ORIGINAL' | 'PHOTO_THUMBNAIL'
  createdAt: string
}

export interface OrderedContent {
  id: number
  isVisible: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}
