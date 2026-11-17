import Link from 'next/link';
import type { Metadata } from 'next';
import { CATEGORIES } from '@/data/books';
import { loadBooksShift } from '@/lib/books';

export const metadata: Metadata = {
  title: 'Danh mục sách',
};

interface BooksPageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

const renderedAt = (): string =>
  new Date().toLocaleTimeString('vi-VN', { hour12: false });

// Kết quả phụ thuộc searchParams của từng request nên trang này render trên server mỗi lần (SSR).
export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { category = '', q = '' } = await searchParams;
  const books = await loadBooksShift({ category, q });

  return (
    <section>
      <h1>Danh mục sách</h1>

      <form className="filter" method="get" action="/books">
        <div className="field">
          <label htmlFor="q">Tìm sách</label>
          <input id="q" name="q" type="text" defaultValue={q} />
        </div>
        <div className="field">
          <label htmlFor="category">Chuyên mục</label>
          <select id="category" name="category" defaultValue={category}>
            <option value="">Tất cả</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <button type="submit">Lọc</button>
        </div>
      </form>

      <p>Tìm thấy {books.length} sách</p>
      <p className="muted">Render lúc: {renderedAt()}</p>

      {books.length === 0 ? (
        <p>Không tìm thấy sách nào</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tên sách</th>
              <th>Tác giả</th>
              <th>Số bản</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <Link href={`/books/${book.id}`}>{book.title}</Link>
                </td>
                <td>{book.author}</td>
                <td>Số bản: {book.copies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
