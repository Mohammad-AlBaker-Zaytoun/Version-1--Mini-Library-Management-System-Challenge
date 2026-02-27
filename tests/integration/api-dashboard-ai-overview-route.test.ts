import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiUserContext, DashboardAiInsight } from '@/lib/types';

const { requireApiUserMock, generateDashboardInsightMock } = vi.hoisted(() => ({
  requireApiUserMock: vi.fn<() => Promise<ApiUserContext>>(),
  generateDashboardInsightMock: vi.fn(),
}));

vi.mock('@/lib/auth/api-auth', () => ({
  requireApiUser: requireApiUserMock,
}));

vi.mock('@/lib/services/ai-insights', () => ({
  generateDashboardInsight: generateDashboardInsightMock,
}));

import { POST } from '@/app/api/dashboard/ai-overview/route';

const memberUser: ApiUserContext = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Member',
  role: 'member',
};

const aiInsightFixture: DashboardAiInsight = {
  overview: 'Utilization remains healthy, but overdue pressure should be watched.',
  healthStatus: 'watch',
  highlights: ['Utilization is at 48%', 'Overdue represents 22% of active loans'],
  recommendations: ['Prioritize overdue reminders', 'Promote available inventory'],
};

describe('/api/dashboard/ai-overview route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiUserMock.mockResolvedValue(memberUser);
    generateDashboardInsightMock.mockResolvedValue(aiInsightFixture);
  });

  it('returns 400 for invalid payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/dashboard/ai-overview', {
      method: 'POST',
      body: JSON.stringify({ totalBooks: 50 }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(generateDashboardInsightMock).not.toHaveBeenCalled();
  });

  it('returns generated AI dashboard insight for valid payload', async () => {
    const request = new NextRequest('http://localhost:3000/api/dashboard/ai-overview', {
      method: 'POST',
      body: JSON.stringify({
        scope: 'member',
        totalBooks: 50,
        availableBooks: 26,
        activeLoans: 24,
        overdueCount: 5,
        utilizationRate: 48,
        monthlyCheckouts: [
          { month: 'Jan 26', count: 8 },
          { month: 'Feb 26', count: 10 },
        ],
        monthlyCheckins: [
          { month: 'Jan 26', count: 7 },
          { month: 'Feb 26', count: 8 },
        ],
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = (await response.json()) as DashboardAiInsight;

    expect(response.status).toBe(200);
    expect(payload.healthStatus).toBe('watch');
    expect(generateDashboardInsightMock).toHaveBeenCalledTimes(1);
  });
});
