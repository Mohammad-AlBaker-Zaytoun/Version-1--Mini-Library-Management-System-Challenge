import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { analyticsOverviewQuerySchema } from '@/lib/schemas/analytics';
import { getAnalyticsOverview } from '@/lib/services/analytics';

function parseRangeMonths(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const actor = await requireApiUser(request);

    const parsedQuery = analyticsOverviewQuerySchema.safeParse({
      rangeMonths: parseRangeMonths(request.nextUrl.searchParams.get('range')),
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? 'Invalid query' },
        { status: 400 },
      );
    }

    const overview = await getAnalyticsOverview(actor, parsedQuery.data);
    return NextResponse.json(overview);
  } catch (error) {
    return handleApiError(error);
  }
}
