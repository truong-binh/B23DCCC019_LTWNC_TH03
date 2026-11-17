import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { generateBooks } from '@/data/books';
import type { LoanFormState } from '@/lib/loan-validate';
import LoanForm from './LoanForm';

const books = generateBooks(24);

const emptyState: LoanFormState = { errors: {}, values: {} };

const fieldOf = (label: string): HTMLElement => {
  const field = screen.getByLabelText(label).closest('.field');
  if (!field) throw new Error(`Không tìm thấy ô ${label}`);
  return field as HTMLElement;
};

describe('LoanForm', () => {
  it('hiện lỗi do action trả về ngay dưới đúng ô', async () => {
    const action = vi.fn<(prev: LoanFormState, formData: FormData) => Promise<LoanFormState>>(
      async () => ({
        errors: {
          bookId: 'Hãy chọn sách',
          pickupDate: 'Hãy chọn ngày',
          term: 'Hãy chọn thời hạn',
          reason: 'Lý do tối thiểu 10 ký tự',
        },
        values: {},
      }),
    );

    render(<LoanForm books={books} action={action} />);
    await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    expect(await screen.findByText('Hãy chọn sách')).toBeInTheDocument();
    expect(fieldOf('Sách')).toHaveTextContent('Hãy chọn sách');
    expect(fieldOf('Ngày lấy sách')).toHaveTextContent('Hãy chọn ngày');
    expect(fieldOf('Thời hạn mượn')).toHaveTextContent('Hãy chọn thời hạn');
    expect(fieldOf('Lý do mượn')).toHaveTextContent('Lý do tối thiểu 10 ký tự');
  });

  it('điền hợp lệ thì gọi action 1 lần với đúng dữ liệu trong FormData', async () => {
    const action = vi.fn<(prev: LoanFormState, formData: FormData) => Promise<LoanFormState>>(
      async () => ({ ...emptyState, message: 'Đã gửi yêu cầu, chờ duyệt', ok: true }),
    );

    render(<LoanForm books={books} action={action} />);

    await userEvent.selectOptions(screen.getByLabelText('Sách'), '3');
    await userEvent.type(screen.getByLabelText('Ngày lấy sách'), '2030-05-20');
    await userEvent.selectOptions(screen.getByLabelText('Thời hạn mượn'), '14');
    await userEvent.clear(screen.getByLabelText('Số quyển'));
    await userEvent.type(screen.getByLabelText('Số quyển'), '2');
    await userEvent.type(
      screen.getByLabelText('Lý do mượn'),
      'Mượn để làm bài tập lớn môn cơ sở dữ liệu',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1];
    expect(formData.get('bookId')).toBe('3');
    expect(formData.get('term')).toBe('14');
    expect(formData.get('quantity')).toBe('2');
    expect(formData.get('pickupDate')).toBe('2030-05-20');
    expect(await screen.findByText('Đã gửi yêu cầu, chờ duyệt')).toBeInTheDocument();
  });

  it('action trả thông báo hết bản thì hiện thông báo và giữ lại dữ liệu đã nhập', async () => {
    const action = vi.fn<(prev: LoanFormState, formData: FormData) => Promise<LoanFormState>>(
      async () => ({
        errors: {},
        values: {
          bookId: '6',
          pickupDate: '2026-12-02',
          term: '14',
          quantity: '1',
          reason: 'Mượn để ôn thi cuối kỳ',
        },
        message: 'Sách đã hết bản vào ngày này',
      }),
    );

    render(<LoanForm books={books} action={action} />);
    await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    expect(await screen.findByText('Sách đã hết bản vào ngày này')).toBeInTheDocument();
    expect(screen.getByLabelText('Lý do mượn')).toHaveValue('Mượn để ôn thi cuối kỳ');
    expect(screen.getByLabelText('Sách')).toHaveValue('6');
    expect(screen.getByLabelText('Ngày lấy sách')).toHaveValue('2026-12-02');
  });

  it('có defaultBookId thì ô Sách được chọn sẵn', () => {
    const action = vi.fn(async () => emptyState);
    render(<LoanForm books={books} defaultBookId={6} action={action} />);

    const select = screen.getByLabelText('Sách');
    expect(select).toHaveValue('6');
    expect(screen.getByRole('option', { name: 'An toàn mạng (1 bản)' })).toBeInTheDocument();
  });
});
