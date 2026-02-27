import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { canActOnMember, requireRole } from '@/lib/auth/permissions';
import type { ApiUserContext } from '@/lib/types';

const adminUser: ApiUserContext = {
  uid: 'admin-1',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin',
};

const memberUser: ApiUserContext = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Member User',
  role: 'member',
};

describe('auth permissions', () => {
  it('allows admin to act on any member', () => {
    expect(canActOnMember('member-2', adminUser)).toBe(true);
  });

  it('allows member to act on self only', () => {
    expect(canActOnMember('member-1', memberUser)).toBe(true);
    expect(canActOnMember('member-2', memberUser)).toBe(false);
  });

  it('throws a forbidden ApiError when role is insufficient', () => {
    expect(() => requireRole(memberUser, 'admin')).toThrow(ApiError);
    expect(() => requireRole(memberUser, 'admin')).toThrow('This action requires admin access');
  });
});
