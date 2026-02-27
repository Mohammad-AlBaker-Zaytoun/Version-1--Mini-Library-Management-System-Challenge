import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { canActOnMember, requireRole } from '@/lib/auth/permissions';

describe('auth permissions', () => {
  it('allows admin to act on any member', () => {
    expect(
      canActOnMember('member-a', {
        uid: 'admin-1',
        email: 'admin@example.com',
        displayName: 'Admin',
        role: 'admin',
      }),
    ).toBe(true);
  });

  it('allows member to act on own profile only', () => {
    const member = {
      uid: 'member-a',
      email: 'member@example.com',
      displayName: 'Member',
      role: 'member' as const,
    };

    expect(canActOnMember('member-a', member)).toBe(true);
    expect(canActOnMember('member-b', member)).toBe(false);
  });

  it('throws when role requirement fails', () => {
    expect(() =>
      requireRole(
        {
          uid: 'member-a',
          email: 'member@example.com',
          displayName: 'Member',
          role: 'member',
        },
        'admin',
      ),
    ).toThrow(ApiError);
  });
});
