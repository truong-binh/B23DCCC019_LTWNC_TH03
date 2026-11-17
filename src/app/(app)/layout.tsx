import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <p className="member-area">Khu vực thành viên</p>
      {children}
    </div>
  );
}
