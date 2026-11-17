import { db } from './db';
import type { Book, Category } from '@/types';

export interface BookFilter {
  category?: string;
  q?: string;
}

/**
 * Lấy danh sách sách theo bộ lọc chuyên mục và tên sách.
 * Chờ 800ms để giả lập một truy vấn chậm.
 */
export const loadBooksShift = async (filter: BookFilter = {}): Promise<Book[]> => {
  await new Promise((r) => setTimeout(r, 800));

  const q = (filter.q ?? '').trim().toLowerCase();
  const category = (filter.category ?? '').trim();

  return db.books.filter((book) => {
    const matchCategory = category === '' || book.category === (category as Category);
    const matchQuery = q === '' || book.title.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  });
};

/** Lấy 1 sách theo id, không có thì trả về undefined. */
export const loadBookById = async (id: number): Promise<Book | undefined> => {
  return db.books.find((book) => book.id === id);
};
