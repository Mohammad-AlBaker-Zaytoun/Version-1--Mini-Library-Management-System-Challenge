import type { ApiUserContext, Role } from '@/lib/types';
import { forbidden } from '@/lib/api/errors';

export function requireRole(user: ApiUserContext, role: Role): void {
  if (user.role !== role) {
    forbidden('This action requires admin access');
  }
}

export function canActOnMember(targetMemberUid: string, user: ApiUserContext): boolean {
  if (user.role === 'admin') {
    return true;
  }

  return targetMemberUid === user.uid;
}
