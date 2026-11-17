import { describe, expect, it } from 'vitest';
import { cancelLoan, listLoans, parseStatus, reviewLoan, submitLoan } from './loans';
import type { Viewer } from '@/types';

const sv01: Viewer = { email: 'sv01@ptit.edu.vn', role: 'student' };
const sv02: Viewer = { email: 'sv02@ptit.edu.vn', role: 'student' };
const admin: Viewer = { email: 'admin@ptit.edu.vn', role: 'admin' };

describe('listLoans', () => {
  it('sv01 có 27 yêu cầu chia thành 3 trang 10/10/7', () => {
    const p1 = listLoans(sv01, '', 1);
    expect(p1.total).toBe(27);
    expect(p1.totalPages).toBe(3);
    expect(p1.items).toHaveLength(10);
    expect(listLoans(sv01, '', 2).items).toHaveLength(10);
    expect(listLoans(sv01, '', 3).items).toHaveLength(7);
  });

  it('sinh viên chỉ thấy yêu cầu của chính mình', () => {
    const page = listLoans(sv02, '', 1);
    expect(page.total).toBe(10);
    expect(page.items.every((l) => l.userEmail === sv02.email)).toBe(true);
  });

  it('admin thấy tất cả 37 yêu cầu và mỗi dòng có tên sách', () => {
    const page = listLoans(admin, '', 1);
    expect(page.total).toBe(37);
    expect(page.totalPages).toBe(4);
    expect(page.items[0].bookTitle.length).toBeGreaterThan(0);
  });

  it('trang vượt giới hạn bị kẹp lại trong khoảng 1…totalPages', () => {
    expect(listLoans(sv01, '', 99).page).toBe(3);
    expect(listLoans(sv01, '', 0).page).toBe(1);
    expect(listLoans(sv01, '', -5).page).toBe(1);
  });

  it('lọc theo trạng thái chờ duyệt: sv01 có 9, admin có 13', () => {
    expect(listLoans(sv01, 'pending', 1).total).toBe(9);
    expect(listLoans(admin, 'pending', 1).total).toBe(13);
  });

  it('parseStatus chỉ nhận 3 trạng thái, giá trị khác coi như không lọc', () => {
    expect(parseStatus('pending')).toBe('pending');
    expect(parseStatus('approved')).toBe('approved');
    expect(parseStatus('rejected')).toBe('rejected');
    expect(parseStatus('abc')).toBe('');
    expect(parseStatus(undefined)).toBe('');
  });
});

describe('submitLoan – kiểm tra tồn kho theo ngày lấy sách', () => {
  it('sách id 6 ngày 2026-12-02 đã hết bản', () => {
    const result = submitLoan(sv01.email, {
      bookId: 6, pickupDate: '2026-12-02', term: 14, quantity: 1,
      reason: 'Mượn để ôn thi cuối kỳ',
    });
    expect(result).toEqual({ ok: false, message: 'Sách đã hết bản vào ngày này' });
  });

  it('yêu cầu đã bị từ chối không chiếm bản nên vẫn mượn được', () => {
    const result = submitLoan(sv01.email, {
      bookId: 11, pickupDate: '2026-12-03', term: 14, quantity: 1,
      reason: 'Mượn để làm bài tập lớn',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.loan.status).toBe('pending');
      expect(listLoans(sv01, '', 1).items[0].id).toBe(result.loan.id);
      expect(cancelLoan(sv01.email, result.loan.id)).toBe('ok'); // dọn lại dữ liệu
    }
  });
});

describe('cancelLoan', () => {
  it('trả đúng 3 mã forbidden, ok, not-found', () => {
    const created = submitLoan(sv01.email, {
      bookId: 24, pickupDate: '2026-12-20', term: 7, quantity: 1,
      reason: 'Mượn để tham khảo thêm',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(cancelLoan(sv02.email, created.loan.id)).toBe('forbidden');
    expect(cancelLoan(sv01.email, created.loan.id)).toBe('ok');
    expect(cancelLoan(sv01.email, created.loan.id)).toBe('not-found');
  });

  it('yêu cầu không còn chờ duyệt thì không hủy được', () => {
    const created = submitLoan(sv01.email, {
      bookId: 24, pickupDate: '2026-12-21', term: 7, quantity: 1,
      reason: 'Mượn để tham khảo thêm',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(reviewLoan(created.loan.id, 'approved')).toBe(true);
    expect(cancelLoan(sv01.email, created.loan.id)).toBe('not-pending');
    expect(reviewLoan(created.loan.id, 'approved')).toBe(false);
  });
});
