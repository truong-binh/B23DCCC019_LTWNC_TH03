import Link from 'next/link';
import { CATEGORIES } from '@/data/books';
import { loadBooksShift } from '@/lib/books';

// Trang chủ gần như không đổi nên được sinh sẵn thành HTML tĩnh khi build (SSG).
export default async function HomePage() {
  const books = await loadBooksShift();

  return (
    <section>
      <h1>Thư viện khoa CNTT PTIT</h1>
      <p>
        {books.length} đầu sách · {CATEGORIES.length} chuyên mục
      </p>
      <p>
        <Link href="/books">Xem danh mục sách</Link>
      </p>
    </section>
  );
}
