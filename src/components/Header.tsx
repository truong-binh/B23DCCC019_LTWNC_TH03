'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="site-header">
      <nav className="nav">
        <Link href="/">Trang chủ</Link>
        <Link href="/books">Sách</Link>

        {user && <Link href="/loans">Sách đã mượn</Link>}
        {user?.role === 'admin' && <Link href="/admin">Quản trị</Link>}

        <span className="nav-spacer" />

        {status === 'loading' ? null : user ? (
          <>
            <span className="nav-user">
              Xin chào, {user.name} ({user.role})
            </span>
            <button type="button" onClick={() => signOut({ redirectTo: '/' })}>
              Đăng xuất
            </button>
          </>
        ) : (
          <Link href="/login">Đăng nhập</Link>
        )}
      </nav>
    </header>
  );
}
