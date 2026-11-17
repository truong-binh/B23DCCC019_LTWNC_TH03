import type { Role } from '@/types';

export type Action =
  | 'book:view'
  | 'loan:create'
  | 'loan:view-own'
  | 'loan:view-all'
  | 'loan:review';

/** Ma trận quyền: role undefined là khách (chưa đăng nhập). */
const MATRIX: Record<Role, Action[]> = {
  student: ['book:view', 'loan:create', 'loan:view-own'],
  admin: ['book:view', 'loan:view-all', 'loan:review'],
};

const GUEST_ACTIONS: Action[] = ['book:view'];

export const can = (role: Role | undefined, action: Action): boolean => {
  const actions = role ? MATRIX[role] : GUEST_ACTIONS;
  return actions.includes(action);
};
