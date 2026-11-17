import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const role = req.auth?.user?.role;

  // Lớp 1: chưa đăng nhập thì về trang đăng nhập, giữ lại đường dẫn đang vào.
  if (!req.auth) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Lớp 2: khu quản trị chỉ dành cho admin.
  if (nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/forbidden', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/loans/:path*', '/admin/:path*'],
};
