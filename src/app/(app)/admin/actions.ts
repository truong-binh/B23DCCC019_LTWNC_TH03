'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { reviewLoan } from '@/lib/loans';
import { can } from '@/lib/permissions';
import type { LoanStatus } from '@/types';

export async function reviewLoanAction(
  id: number,
  status: Extract<LoanStatus, 'approved' | 'rejected'>,
): Promise<void> {
  // Server Action là endpoint công khai nên phải tự kiểm tra quyền bên trong.
  const session = await auth();
  if (!can(session?.user?.role, 'loan:review')) {
    throw new Error('Không có quyền');
  }

  // Chỉ đổi những yêu cầu đang chờ duyệt.
  reviewLoan(id, status);
  revalidatePath('/admin');
}
