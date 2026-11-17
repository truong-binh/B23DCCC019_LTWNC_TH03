import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadBookById, loadBooksShift } from '@/lib/books';

// Chi tiết sách: sinh sẵn 12 trang đầu khi build, làm mới lại sau mỗi 60 giây (ISR).
export const revalidate = 60;

interface BookPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const books = await loadBooksShift();
  return books.slice(0, 12).map((book) => ({ id: String(book.id) }));
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { id } = await params;
  const book = await loadBookById(Number(id));
  if (!book) return { title: 'Không tìm thấy sách' };

  return {
    title: `${book.title} – ${book.author}`,
    description: `Sách ${book.category}, thư viện có ${book.copies} bản.`,
  };
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { id } = await params;
  const book = await loadBookById(Number(id));
  if (!book) notFound();

  const updatedAt = new Date().toLocaleTimeString('vi-VN', { hour12: false });

  return (
    <article>
      <h1>{book.title}</h1>
      <p>Tác giả: {book.author}</p>
      <p>Chuyên mục: {book.category}</p>
      <p>Số bản: {book.copies}</p>
      <p className="muted">Cập nhật lúc: {updatedAt}</p>
      <p>
        <Link href={`/loans?book=${book.id}`}>Mượn sách này</Link>
      </p>
    </article>
  );
}
