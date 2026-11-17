import { db } from './db';
import { can } from './permissions';
import type { LoanData } from './loan-validate';
import type { Loan, LoanStatus, Viewer } from '@/types';

export const PAGE_SIZE = 10;

export interface LoanItem extends Loan {
  bookTitle: string;
}

export interface LoanPage {
  items: LoanItem[];
  total: number;
  page: number;
  totalPages: number;
}

export type SubmitResult =
  | { ok: true; loan: Loan }
  | { ok: false; message: string };

export type CancelResult = 'ok' | 'not-found' | 'forbidden' | 'not-pending';

const bookTitle = (bookId: number): string =>
  db.books.find((b) => b.id === bookId)?.title ?? 'Không rõ';

/** Chỉ nhận pending, approved, rejected; giá trị khác coi như không lọc. */
export const parseStatus = (v: unknown): LoanStatus | '' => {
  if (v === 'pending' || v === 'approved' || v === 'rejected') return v;
  return '';
};

/** Kẹp số trang vào khoảng 1…totalPages. */
const clampPage = (page: number, totalPages: number): number => {
  if (!Number.isFinite(page) || !Number.isInteger(page)) return 1;
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
};

/**
 * Danh sách yêu cầu mượn có lọc theo trạng thái và phân trang (10 dòng / trang).
 * student chỉ thấy yêu cầu của chính mình, admin thấy tất cả.
 */
export const listLoans = (
  viewer: Viewer,
  status: LoanStatus | '' = '',
  page = 1,
): LoanPage => {
  const seeAll = can(viewer.role, 'loan:view-all');
  const seeOwn = can(viewer.role, 'loan:view-own');

  let rows: Loan[] = [];
  if (seeAll) rows = db.loans;
  else if (seeOwn) rows = db.loans.filter((l) => l.userEmail === viewer.email);

  const filtered = status === '' ? rows : rows.filter((l) => l.status === status);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = clampPage(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;

  const items: LoanItem[] = filtered
    .slice(start, start + PAGE_SIZE)
    .map((loan) => ({ ...loan, bookTitle: bookTitle(loan.bookId) }));

  return { items, total, page: current, totalPages };
};

/**
 * Tạo yêu cầu mượn mới sau khi kiểm tra tồn kho theo từng ngày lấy sách.
 * Yêu cầu đã bị từ chối không chiếm bản.
 */
export const submitLoan = (email: string, data: LoanData): SubmitResult => {
  const book = db.books.find((b) => b.id === data.bookId);
  if (!book) return { ok: false, message: 'Hãy chọn sách' };

  const taken = db.loans
    .filter(
      (l) =>
        l.bookId === data.bookId
        && l.pickupDate === data.pickupDate
        && l.status !== 'rejected',
    )
    .reduce((sum, l) => sum + l.quantity, 0);

  if (taken + data.quantity > book.copies) {
    return { ok: false, message: 'Sách đã hết bản vào ngày này' };
  }

  const loan: Loan = {
    id: db.nextLoanId++,
    bookId: data.bookId,
    userEmail: email,
    pickupDate: data.pickupDate,
    term: data.term,
    quantity: data.quantity,
    reason: data.reason,
    status: 'pending',
  };
  db.loans.unshift(loan);
  return { ok: true, loan };
};

/** Hủy yêu cầu đang chờ duyệt của chính mình. */
export const cancelLoan = (email: string, id: number): CancelResult => {
  const index = db.loans.findIndex((l) => l.id === id);
  if (index === -1) return 'not-found';

  const loan = db.loans[index];
  if (loan.userEmail !== email) return 'forbidden';
  if (loan.status !== 'pending') return 'not-pending';

  db.loans.splice(index, 1);
  return 'ok';
};

/** Thủ thư duyệt hoặc từ chối; chỉ đổi yêu cầu đang chờ duyệt. */
export const reviewLoan = (
  id: number,
  status: Extract<LoanStatus, 'approved' | 'rejected'>,
): boolean => {
  const loan = db.loans.find((l) => l.id === id);
  if (!loan || loan.status !== 'pending') return false;
  loan.status = status;
  return true;
};

/** Toàn bộ yêu cầu đang chờ duyệt (trang quản trị hiển thị hết, không phân trang). */
export const listPendingLoans = (viewer: Viewer): LoanItem[] => {
  if (!can(viewer.role, 'loan:review')) return [];
  return db.loans
    .filter((l) => l.status === 'pending')
    .map((loan) => ({ ...loan, bookTitle: bookTitle(loan.bookId) }));
};

/** Thống kê theo trạng thái cho trang quản trị. */
export const countByStatus = (): Record<LoanStatus, number> => ({
  pending: db.loans.filter((l) => l.status === 'pending').length,
  approved: db.loans.filter((l) => l.status === 'approved').length,
  rejected: db.loans.filter((l) => l.status === 'rejected').length,
});
