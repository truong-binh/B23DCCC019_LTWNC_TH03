import { describe, expect, it } from 'vitest';
import { generateBooks } from '../data/books';
import {
  toLoanData,
  toLoanInput,
  today,
  validateLoan,
  type LoanInput,
} from './loan-validate';

const books = generateBooks(24);

const FUTURE_DATE = '2030-05-20';

const input = (over: Partial<LoanInput> = {}): LoanInput => ({
  bookId: '3',
  pickupDate: FUTURE_DATE,
  term: '14',
  quantity: '1',
  reason: 'Mượn để làm bài tập lớn môn cơ sở dữ liệu',
  ...over,
});

const yesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

describe('validateLoan', () => {
  it('dữ liệu hợp lệ thì trả về object rỗng', () => {
    expect(validateLoan(input(), books)).toEqual({});
  });

  it('form trống thì báo đủ lỗi của từng ô', () => {
    const errors = validateLoan(toLoanInput({}), books);
    expect(errors).toEqual({
      bookId: 'Hãy chọn sách',
      pickupDate: 'Hãy chọn ngày',
      term: 'Hãy chọn thời hạn',
      quantity: 'Số quyển phải từ 1 trở lên',
      reason: 'Lý do tối thiểu 10 ký tự',
    });
  });

  it('ngày lấy sách ở quá khứ thì bị từ chối', () => {
    const errors = validateLoan(input({ pickupDate: yesterday() }), books);
    expect(errors.pickupDate).toBe('Ngày lấy sách không được ở quá khứ');
    expect(validateLoan(input({ pickupDate: today() }), books).pickupDate).toBeUndefined();
  });

  it('lý do dưới 10 ký tự là sai, chuỗi toàn khoảng trắng cũng sai', () => {
    expect(validateLoan(input({ reason: 'Ngắn quá' }), books).reason)
      .toBe('Lý do tối thiểu 10 ký tự');
    expect(validateLoan(input({ reason: '              ' }), books).reason)
      .toBe('Lý do tối thiểu 10 ký tự');
  });

  it('số quyển vượt số bản của sách đã chọn', () => {
    const errors = validateLoan(input({ bookId: '1', quantity: '2' }), books);
    expect(errors.quantity).toBe('Vượt số bản của sách (1 bản)');
  });

  it('số quyển phải là số nguyên dương', () => {
    expect(validateLoan(input({ quantity: '0' }), books).quantity)
      .toBe('Số quyển phải từ 1 trở lên');
    expect(validateLoan(input({ quantity: '-2' }), books).quantity)
      .toBe('Số quyển phải từ 1 trở lên');
    expect(validateLoan(input({ quantity: '1.5' }), books).quantity)
      .toBe('Số quyển phải từ 1 trở lên');
    expect(validateLoan(input({ quantity: 'hai' }), books).quantity)
      .toBe('Số quyển phải từ 1 trở lên');
  });

  it('thời hạn ngoài 7, 14, 30 ngày là không hợp lệ', () => {
    expect(validateLoan(input({ term: '10' }), books).term).toBe('Hãy chọn thời hạn');
  });

  it('sách không tồn tại thì báo lỗi chọn sách', () => {
    expect(validateLoan(input({ bookId: '999' }), books).bookId).toBe('Hãy chọn sách');
  });
});

describe('toLoanInput / toLoanData', () => {
  it('đọc được FormData và bù chuỗi rỗng cho trường còn thiếu', () => {
    const fd = new FormData();
    fd.set('bookId', '6');
    fd.set('reason', 'Mượn để ôn thi cuối kỳ');
    expect(toLoanInput(fd)).toEqual({
      bookId: '6',
      pickupDate: '',
      term: '',
      quantity: '',
      reason: 'Mượn để ôn thi cuối kỳ',
    });
  });

  it('ép kiểu số từ chuỗi và trim lý do', () => {
    const data = toLoanData(
      input({ bookId: '6', term: '30', quantity: '2', reason: '  Mượn để ôn thi cuối kỳ  ' }),
    );
    expect(data).toEqual({
      bookId: 6,
      pickupDate: FUTURE_DATE,
      term: 30,
      quantity: 2,
      reason: 'Mượn để ôn thi cuối kỳ',
    });
  });
});
