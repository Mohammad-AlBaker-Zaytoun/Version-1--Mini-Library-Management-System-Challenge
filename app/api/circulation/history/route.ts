import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { circulationHistoryQuerySchema } from '@/lib/schemas/circulation';
import { getCirculationHistory } from '@/lib/services/circulation';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const actor = await requireApiUser(request);

    const parsedQuery = circulationHistoryQuerySchema.safeParse({
      action: request.nextUrl.searchParams.get('action') ?? undefined,
      memberUid: request.nextUrl.searchParams.get('memberUid') ?? undefined,
      bookId: request.nextUrl.searchParams.get('bookId') ?? undefined,
      page: request.nextUrl.searchParams.get('page') ?? undefined,
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? 'Invalid query' },
        { status: 400 },
      );
    }

    const result = await getCirculationHistory(parsedQuery.data, actor);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
