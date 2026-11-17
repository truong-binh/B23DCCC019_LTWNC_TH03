import type { MetadataRoute } from 'next';
import { loadBooksShift } from '@/lib/books';

const BASE_URL = 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await loadBooksShift();

  return [
    { url: `${BASE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/books`, changeFrequency: 'daily', priority: 0.8 },
    ...books.map((book) => ({
      url: `${BASE_URL}/books/${book.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
