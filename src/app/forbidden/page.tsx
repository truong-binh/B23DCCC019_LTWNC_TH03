import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Không có quyền',
  robots: { index: false },
};

export default function ForbiddenPage() {
  return (
    <section>
      <h1>Không có quyền</h1>
      <p>Bạn không có quyền truy cập trang này</p>
    </section>
  );
}
