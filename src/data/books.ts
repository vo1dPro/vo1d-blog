import type { Book } from '@/types'

export const books: Book[] = [
  {
    id: 1,
    title: '深入理解 TypeScript',
    author: 'Basarat',
    cover: '/images/books/book-1.jpg',
    rating: 5,
    comment: '系统学习 TypeScript 类型系统的最佳参考书。',
  },
  {
    id: 2,
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    cover: '/images/books/book-2.jpg',
    rating: 4,
    comment: '编写可维护代码的经典之作，值得反复阅读。',
  },
  {
    id: 3,
    title: '设计模式',
    author: 'GoF',
    cover: '/images/books/book-3.jpg',
    rating: 4,
    comment: '面向对象设计的基石，23 种经典模式的系统讲解。',
  },
]
