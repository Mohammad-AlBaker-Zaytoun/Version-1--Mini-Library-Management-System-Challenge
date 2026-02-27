import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUserContext, CatalogAiRecommendation } from '@/lib/types';

const { requireApiUserMock, getCatalogRecommendationForUserMock } = vi.hoisted(() => ({
  requireApiUserMock: vi.fn<() => Promise<ApiUserContext>>(),
  getCatalogRecommendationForUserMock: vi.fn(),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/services/catalog-ai', () => ({
  getCatalogRecommendationForUser: getCatalogRecommendationForUserMock,
}));

import { POST } from '@/app/api/catalog/ai-recommendation/route';

const memberUser: ApiUserContext = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Member',
  role: 'member',
};

const recommendationFixture: CatalogAiRecommendation = {
  recommendedBook: {
    id: 'book-001',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    genre: 'Software Engineering',
    coverUrl: undefined,
    tags: ['Engineering', 'Refactoring'],
    availability: 'available',
  },
  reason: 'This aligns with your recent software engineering checkout history.',
  whyItFits: [
    'Genre overlap with your recent activity',
    'Book is currently available for immediate checkout',
  ],
  basedOn: {
    checkoutCount: 7,
    checkinCount: 6,
    favoriteGenres: ['Software Engineering'],
    favoriteTags: ['Engineering', 'Refactoring'],
  },
};

describe('/api/catalog/ai-recommendation route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue(memberUser);
    getCatalogRecommendationForUserMock.mockResolvedValue(recommendationFixture);
  });

  it('returns recommendation payload for authenticated user', async () => {
    const request = new NextRequest('http://localhost:3000/api/catalog/ai-recommendation', {
      method: 'POST',
    });

    const response = await POST(request);
    const payload = (await response.json()) as CatalogAiRecommendation;

    expect(response.status).toBe(200);
    expect(payload.recommendedBook?.id).toBe('book-001');
    expect(getCatalogRecommendationForUserMock).toHaveBeenCalledWith(memberUser);
  });
});
