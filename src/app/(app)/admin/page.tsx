import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { STATUS_LABEL, TERM_LABEL, formatDate } from '@/lib/format';
import { countByStatus, listPendingLoans } from '@/lib/loans';
import { can } from '@/lib/permissions';
import type { Viewer } from '@/types';
import { reviewLoanAction } from './actions';

export const metadata: Metadata = {
  title: 'Duyệt yêu cầu mượn',
  robots: { index: false },
};

export default async function AdminPage() {
  const session = await auth();
  const email = session?.user?.email;
  const role = session?.user?.role;

  // Kiểm tra lại quyền ngay trong trang, phòng khi proxy cấu hình sai.
  if (!email || !role || !can(role, 'loan:review')) redirect('/forbidden');

  const viewer: Viewer = { email, role };
  const counts = countByStatus();
  const items = listPendingLoans(viewer);

  return (
    <section>
      <h1>Duyệt yêu cầu mượn</h1>

      <p>
        {STATUS_LABEL.pending}: {counts.pending} | {STATUS_LABEL.approved}:{' '}
        {counts.approved} | {STATUS_LABEL.rejected}: {counts.rejected}
      </p>

      {items.length === 0 ? (
        <p>Không có yêu cầu nào đang chờ duyệt</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tên sách</th>
              <th>Ngày lấy</th>
              <th>Thời hạn</th>
              <th>Người mượn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.bookTitle}</td>
                <td>{formatDate(loan.pickupDate)}</td>
                <td>{TERM_LABEL[loan.term]}</td>
                <td>{loan.userEmail}</td>
                <td className="pager">
                  <form action={reviewLoanAction.bind(null, loan.id, 'approved')}>
                    <button type="submit">Duyệt</button>
                  </form>
                  <form action={reviewLoanAction.bind(null, loan.id, 'rejected')}>
                    <button type="submit">Từ chối</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
