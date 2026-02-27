import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { listTransactions } from '@/lib/services/circulation';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '200');

    const entries = await listTransactions({
      user,
      limit: Number.isNaN(limit) ? 200 : Math.min(Math.max(limit, 1), 500),
    });

    return NextResponse.json({ items: entries });
  } catch (error) {
    return handleApiError(error);
  }
}
