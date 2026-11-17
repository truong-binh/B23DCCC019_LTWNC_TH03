'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { cancelLoan, submitLoan } from '@/lib/loans';
import { can } from '@/lib/permissions';
import {
  keepValues,
  toLoanData,
  toLoanInput,
  validateLoan,
  type LoanFormState,
} from '@/lib/loan-validate';

/** Server Action là endpoint công khai nên phải tự kiểm tra quyền bên trong. */
const requireUser = async (action: 'loan:create' | 'loan:view-own') => {
  const session = await auth();
  const email = session?.user?.email ?? '';
  if (!email || !can(session?.user?.role, action)) {
    throw new Error('Không có quyền');
  }
  return email;
};

export async function createLoanAction(
  _prevState: LoanFormState,
  formData: FormData,
): Promise<LoanFormState> {
  const email = await requireUser('loan:create');

  const input = toLoanInput(formData);
  const errors = validateLoan(input, db.books);
  if (Object.keys(errors).length > 0) {
    return { errors, values: keepValues(input) };
  }

  const result = submitLoan(email, toLoanData(input));
  if (!result.ok) {
    return { errors: {}, values: keepValues(input), message: result.message };
  }

  revalidatePath('/loans');
  return {
    errors: {},
    values: {},
    message: 'Đã gửi yêu cầu, chờ duyệt',
    ok: true,
  };
}

export async function cancelLoanAction(id: number): Promise<void> {
  const email = await requireUser('loan:view-own');

  // Yêu cầu của người khác hoặc không còn chờ duyệt thì bỏ qua.
  cancelLoan(email, id);
  revalidatePath('/loans');
}
