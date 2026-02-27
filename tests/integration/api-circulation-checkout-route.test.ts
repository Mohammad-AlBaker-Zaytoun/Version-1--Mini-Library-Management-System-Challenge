import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUserContext } from '@/lib/types';

const { requireApiUserMock, checkoutBookMock } = vi.hoisted(() => ({
  requireApiUserMock: vi.fn<() => Promise<ApiUserContext>>(),
  checkoutBookMock: vi.fn(),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/services/circulation', () => ({
  checkoutBook: checkoutBookMock,
}));

import { POST } from '@/app/api/circulation/checkout/route';

const memberUser: ApiUserContext = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Member',
  role: 'member',
};

describe('/api/circulation/checkout route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue(memberUser);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/circulation/checkout', {
      method: 'POST',
      body: JSON.stringify({ dueDays: 14 }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(checkoutBookMock).not.toHaveBeenCalled();
  });

  it('returns 200 and delegates to checkout service for valid payload', async () => {
    checkoutBookMock.mockResolvedValue({
      book: { id: 'book-1', availability: 'checked_out' },
      transaction: { id: 'tx-1', action: 'checkout' },
    });

    const request = new NextRequest('http://localhost:3000/api/circulation/checkout', {
      method: 'POST',
      body: JSON.stringify({ bookId: 'book-1', dueDays: 14 }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(checkoutBookMock).toHaveBeenCalledWith(
      expect.objectContaining({ bookId: 'book-1', dueDays: 14 }),
      memberUser,
    );
  });
});
