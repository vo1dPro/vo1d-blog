import { allPages } from '../client'
import type { Category } from './model'

export const getCategories = (signal: AbortSignal) => allPages<Category>('/categories', signal)
