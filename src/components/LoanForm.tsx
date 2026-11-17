'use client';

import { useActionState } from 'react';
import { TERMS } from '@/data/books';
import { TERM_LABEL } from '@/lib/format';
import type { LoanFormState } from '@/lib/loan-validate';
import type { Book } from '@/types';

export type LoanFormAction = (
  prev: LoanFormState,
  formData: FormData,
) => Promise<LoanFormState>;

export interface LoanFormProps {
  books: Book[];
  defaultBookId?: number;
  action: LoanFormAction;
}

const initialState: LoanFormState = { errors: {}, values: {} };

export default function LoanForm({ books, defaultBookId, action }: LoanFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const { errors, values } = state;

  // React 19 xóa form sau mỗi lần gửi, nên dựng lại form theo giá trị action trả về.
  const formKey = JSON.stringify(values ?? {});

  return (
    <form key={formKey} className="loan-form" action={formAction}>
      <h2>Gửi yêu cầu mượn sách</h2>

      <div className="field">
        <label htmlFor="bookId">Sách</label>
        <select
          id="bookId"
          name="bookId"
          defaultValue={values.bookId ?? (defaultBookId ? String(defaultBookId) : '')}
        >
          <option value="">-- Chọn sách --</option>
          {books.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title} ({book.copies} bản)
            </option>
          ))}
        </select>
        {errors.bookId && (
          <span className="error" role="alert">
            {errors.bookId}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="pickupDate">Ngày lấy sách</label>
        <input
          id="pickupDate"
          name="pickupDate"
          type="date"
          defaultValue={values.pickupDate ?? ''}
        />
        {errors.pickupDate && (
          <span className="error" role="alert">
            {errors.pickupDate}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="term">Thời hạn mượn</label>
        <select id="term" name="term" defaultValue={values.term ?? ''}>
          <option value="">-- Chọn thời hạn --</option>
          {TERMS.map((term) => (
            <option key={term} value={term}>
              {TERM_LABEL[term]}
            </option>
          ))}
        </select>
        {errors.term && (
          <span className="error" role="alert">
            {errors.term}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="quantity">Số quyển</label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          defaultValue={values.quantity ?? '1'}
        />
        {errors.quantity && (
          <span className="error" role="alert">
            {errors.quantity}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="reason">Lý do mượn</label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          defaultValue={values.reason ?? ''}
        />
        {errors.reason && (
          <span className="error" role="alert">
            {errors.reason}
          </span>
        )}
      </div>

      {state.message && (
        <p className={state.ok ? 'message-ok' : 'error'} role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending}>
        Gửi yêu cầu
      </button>
    </form>
  );
}
