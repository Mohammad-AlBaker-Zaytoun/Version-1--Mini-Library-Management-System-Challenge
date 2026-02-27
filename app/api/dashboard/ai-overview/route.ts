import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { parseJsonBody } from '@/lib/api/request';
import { requireApiUser } from '@/lib/auth/api-auth';
import { dashboardAiInsightInputSchema } from '@/lib/schemas/ai';
import { generateDashboardInsight } from '@/lib/services/ai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await requireApiUser(request);

    const body = await parseJsonBody(request);
    const parsedBody = dashboardAiInsightInputSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const insight = await generateDashboardInsight(parsedBody.data);
    return NextResponse.json(insight);
  } catch (error) {
    return handleApiError(error);
  }
}
