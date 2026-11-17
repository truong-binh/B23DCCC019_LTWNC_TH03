import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import LoanForm from '@/components/LoanForm';
import { loadBooksShift } from '@/lib/books';
import { STATUS_LABEL, TERM_LABEL, formatDate } from '@/lib/format';
import { listLoans, parseStatus } from '@/lib/loans';
import { can } from '@/lib/permissions';
import type { Viewer } from '@/types';
import { cancelLoanAction, createLoanAction } from './actions';

export const metadata: Metadata = {
  title: 'Sách đã mượn',
  robots: { index: false },
};

interface LoansPageProps {
  searchParams: Promise<{ status?: string; page?: string; book?: string }>;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: STATUS_LABEL.pending },
  { value: 'approved', label: STATUS_LABEL.approved },
  { value: 'rejected', label: STATUS_LABEL.rejected },
];

export default async function LoansPage({ searchParams }: LoansPageProps) {
  const session = await auth();
  const email = session?.user?.email;
  const role = session?.user?.role;
  if (!email || !role) redirect('/login?callbackUrl=%2Floans');

  const viewer: Viewer = { email, role };
  const { status: rawStatus = '', page: rawPage, book: rawBook } = await searchParams;

  const status = parseStatus(rawStatus);
  const requestedPage = Number(rawPage);
  const { items, page, totalPages } = listLoans(
    viewer,
    status,
    Number.isInteger(requestedPage) ? requestedPage : 1,
  );

  const canCreate = can(role, 'loan:create');
  const books = canCreate ? await loadBooksShift() : [];
  const defaultBookId = Number(rawBook);

  const pageHref = (target: number) =>
    `/loans?status=${encodeURIComponent(status)}&page=${target}`;

  return (
    <section>
      <h1>Sách đã mượn</h1>

      <form className="filter" method="get" action="/loans">
        <div className="field">
          <label htmlFor="status">Trạng thái</label>
          <select id="status" name="status" defaultValue={status}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <button type="submit">Lọc</button>
        </div>
      </form>

      {items.length === 0 ? (
        <p>Chưa có yêu cầu mượn nào</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tên sách</th>
              <th>Ngày lấy</th>
              <th>Thời hạn</th>
              <th>Số quyển</th>
              <th>Trạng thái</th>
              {canCreate && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.bookTitle}</td>
                <td>{formatDate(loan.pickupDate)}</td>
                <td>{TERM_LABEL[loan.term]}</td>
                <td>{loan.quantity} quyển</td>
                <td>{STATUS_LABEL[loan.status]}</td>
                {canCreate && (
                  <td>
                    {loan.status === 'pending' && loan.userEmail === email && (
                      <form action={cancelLoanAction.bind(null, loan.id)}>
                        <button type="submit">Hủy</button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pager">
        {page > 1 ? <Link href={pageHref(page - 1)}>Trước</Link> : <span>Trước</span>}
        {page < totalPages ? (
          <Link href={pageHref(page + 1)}>Sau</Link>
        ) : (
          <span>Sau</span>
        )}
        <span className="muted">
          Trang {page}/{totalPages}
        </span>
      </div>

      {canCreate && (
        <LoanForm
          books={books}
          defaultBookId={Number.isInteger(defaultBookId) && defaultBookId > 0 ? defaultBookId : undefined}
          action={createLoanAction}
        />
      )}
    </section>
  );
}
