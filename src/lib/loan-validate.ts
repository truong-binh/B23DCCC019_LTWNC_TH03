import type { Book } from '@/types';

export interface LoanInput {
  bookId: string; pickupDate: string; term: string;
  quantity: string; reason: string;
}

export interface LoanData {
  bookId: number; pickupDate: string; term: 7 | 14 | 30;
  quantity: number; reason: string;
}

export type LoanErrors = Partial<Record<keyof LoanInput, string>>;

export interface LoanFormState {
  errors: LoanErrors;          // lỗi từng ô
  values: Partial<LoanInput>;  // giá trị đã nhập, để hiện lại khi có lỗi
  message?: string;            // thông báo chung (thành công hoặc lỗi từ server)
  ok?: boolean;                // true nếu message là thông báo thành công
}

const FIELDS: (keyof LoanInput)[] = [
  'bookId', 'pickupDate', 'term', 'quantity', 'reason',
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TERMS = [7, 14, 30];
const MIN_REASON = 10;

/** Ngày hôm nay dạng YYYY-MM-DD (theo giờ địa phương). */
export const today = (): string => {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
};

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/** Đổi object hoặc FormData thành LoanInput; thiếu trường thì thành chuỗi rỗng. */
export const toLoanInput = (
  raw: FormData | Record<string, unknown> | null | undefined,
): LoanInput => {
  const read = (field: keyof LoanInput): string => {
    if (!raw) return '';
    if (typeof FormData !== 'undefined' && raw instanceof FormData) {
      return asString(raw.get(field));
    }
    const value = (raw as Record<string, unknown>)[field];
    if (typeof value === 'number') return String(value);
    return asString(value);
  };

  return {
    bookId: read('bookId'),
    pickupDate: read('pickupDate'),
    term: read('term'),
    quantity: read('quantity'),
    reason: read('reason'),
  };
};

const isValidDate = (iso: string): boolean => {
  if (!DATE_RE.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y
    && date.getUTCMonth() === m - 1
    && date.getUTCDate() === d;
};

/**
 * Nơi duy nhất giữ các quy tắc kiểm tra yêu cầu mượn.
 * Trả về object lỗi theo tên trường; rỗng nghĩa là hợp lệ, mỗi trường chỉ báo 1 lỗi.
 */
export const validateLoan = (input: LoanInput, books: Book[]): LoanErrors => {
  const errors: LoanErrors = {};

  const bookId = Number(input.bookId);
  const book = Number.isInteger(bookId)
    ? books.find((b) => b.id === bookId)
    : undefined;
  if (!book) errors.bookId = 'Hãy chọn sách';

  if (!isValidDate(input.pickupDate)) {
    errors.pickupDate = 'Hãy chọn ngày';
  } else if (input.pickupDate < today()) {
    errors.pickupDate = 'Ngày lấy sách không được ở quá khứ';
  }

  const term = Number(input.term);
  if (!VALID_TERMS.includes(term)) errors.term = 'Hãy chọn thời hạn';

  const quantity = Number(input.quantity);
  if (input.quantity.trim() === '' || !Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Số quyển phải từ 1 trở lên';
  } else if (book && quantity > book.copies) {
    errors.quantity = `Vượt số bản của sách (${book.copies} bản)`;
  }

  if (input.reason.trim().length < MIN_REASON) {
    errors.reason = `Lý do tối thiểu ${MIN_REASON} ký tự`;
  }

  return errors;
};

/** Ép kiểu dữ liệu đã hợp lệ; chỉ gọi khi validateLoan không còn lỗi. */
export const toLoanData = (input: LoanInput): LoanData => ({
  bookId: Number(input.bookId),
  pickupDate: input.pickupDate,
  term: Number(input.term) as LoanData['term'],
  quantity: Number(input.quantity),
  reason: input.reason.trim(),
});

/** Giữ lại dữ liệu người dùng đã nhập để hiện lại khi có lỗi. */
export const keepValues = (input: LoanInput): Partial<LoanInput> =>
  FIELDS.reduce<Partial<LoanInput>>((acc, field) => {
    acc[field] = input[field];
    return acc;
  }, {});
