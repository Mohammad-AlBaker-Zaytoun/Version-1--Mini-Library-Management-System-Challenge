import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { getCatalogRecommendationForUser } from '@/lib/services/catalog-ai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    const recommendation = await getCatalogRecommendationForUser(user);

    return NextResponse.json(recommendation);
  } catch (error) {
    return handleApiError(error);
  }
}
