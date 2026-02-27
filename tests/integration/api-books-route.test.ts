import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUserContext } from '@/lib/types';

const {
  requireApiUserMock,
  requireRoleMock,
  searchBooksMock,
  createBookMock,
} = vi.hoisted(() => ({
  requireApiUserMock: vi.fn<() => Promise<ApiUserContext>>(),
  requireRoleMock: vi.fn(),
  searchBooksMock: vi.fn(),
  createBookMock: vi.fn(),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/auth/permissions', () => ({
  requireRole: requireRoleMock,
}));

vi.mock('@/lib/services/books', () => ({
  searchBooks: searchBooksMock,
  createBook: createBookMock,
}));

import { GET, POST } from '@/app/api/books/route';

const adminUser: ApiUserContext = {
  uid: 'admin-1',
  email: 'admin@example.com',
  displayName: 'Admin',
  role: 'admin',
};

describe('/api/books route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue(adminUser);
    requireRoleMock.mockImplementation(() => undefined);
  });

  it('GET returns 400 for invalid query values', async () => {
    const request = new NextRequest('http://localhost:3000/api/books?page=0');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(searchBooksMock).not.toHaveBeenCalled();
  });

  it('GET returns search results for valid query', async () => {
    searchBooksMock.mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/books?q=clean&tags=architecture,backend&availability=available&page=1&limit=10',
    );
    const response = await GET(request);
    const payload = (await response.json()) as { total: number };

    expect(response.status).toBe(200);
    expect(payload.total).toBe(0);
    expect(searchBooksMock).toHaveBeenCalledTimes(1);
  });

  it('POST creates a book when payload is valid', async () => {
    createBookMock.mockResolvedValue({
      id: 'book-1',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      tags: ['Engineering'],
      searchBlob: 'clean code robert c martin engineering',
      availability: 'available',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      createdByUid: 'admin-1',
      updatedByUid: 'admin-1',
    });

    const request = new NextRequest('http://localhost:3000/api/books', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        tags: ['Engineering'],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(requireRoleMock).toHaveBeenCalledWith(adminUser, 'admin');
    expect(createBookMock).toHaveBeenCalledTimes(1);
  });
});
