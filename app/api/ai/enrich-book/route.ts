import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { requireRole } from '@/lib/auth/permissions';
import { parseJsonBody } from '@/lib/api/request';
import { aiEnrichmentSchema } from '@/lib/schemas/ai';
import { generateBookEnrichment } from '@/lib/services/ai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    requireRole(user, 'admin');

    const body = await parseJsonBody(request);
    const parsedBody = aiEnrichmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const enrichment = await generateBookEnrichment(parsedBody.data);
    return NextResponse.json(enrichment);
  } catch (error) {
    return handleApiError(error);
  }
}
