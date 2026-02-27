import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsOverview, ApiUserContext } from '@/lib/types';

const { requireApiUserMock, getAnalyticsOverviewMock } = vi.hoisted(() => ({
  requireApiUserMock: vi.fn<() => Promise<ApiUserContext>>(),
  getAnalyticsOverviewMock: vi.fn(),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/services/analytics', () => ({
  getAnalyticsOverview: getAnalyticsOverviewMock,
}));

import { GET } from '@/app/api/analytics/overview/route';

const memberUser: ApiUserContext = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Member',
  role: 'member',
};

const analyticsOverviewFixture: AnalyticsOverview = {
  scope: 'member',
  totalBooks: 50,
  availableBooks: 35,
  activeLoans: 2,
  overdueCount: 1,
  myActiveLoans: 2,
  myOverdueLoans: 1,
  utilizationRate: 4,
  monthlyCheckouts: [
    { month: 'Jan 26', count: 1 },
    { month: 'Feb 26', count: 2 },
    { month: 'Mar 26', count: 0 },
  ],
  monthlyCheckins: [
    { month: 'Jan 26', count: 0 },
    { month: 'Feb 26', count: 1 },
    { month: 'Mar 26', count: 1 },
  ],
};

describe('/api/analytics/overview route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue(memberUser);
    getAnalyticsOverviewMock.mockResolvedValue(analyticsOverviewFixture);
  });

  it('returns 400 for unsupported range', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/overview?range=9');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(getAnalyticsOverviewMock).not.toHaveBeenCalled();
  });

  it('returns overview payload for supported range', async () => {
    const request = new NextRequest('http://localhost:3000/api/analytics/overview?range=6');
    const response = await GET(request);
    const payload = (await response.json()) as AnalyticsOverview;

    expect(response.status).toBe(200);
    expect(payload.scope).toBe('member');
    expect(getAnalyticsOverviewMock).toHaveBeenCalledWith(memberUser, { rangeMonths: 6 });
  });
});
