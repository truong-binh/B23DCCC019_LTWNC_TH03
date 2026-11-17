const BUILD_TAG = "rb-6129";
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Thư viện khoa CNTT',
    template: '%s | Thư viện khoa',
  },
  description: 'Tra cứu và đăng ký mượn sách tại thư viện khoa CNTT PTIT.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body data-build={BUILD_TAG}>
        <header className="site-header">
          <nav className="nav">
            <Link href="/">Trang chủ</Link>
            <Link href="/books">Sách</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
