import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { parseJsonBody } from '@/lib/api/request';
import { requireApiUser } from '@/lib/auth/api-auth';
import { requireRole } from '@/lib/auth/permissions';
import { enrichBookRequestSchema } from '@/lib/schemas/ai';
import { enrichBookMetadata } from '@/lib/services/ai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    requireRole(user, 'admin');

    const body = await parseJsonBody(request);
    const parsed = enrichBookRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const enrichment = await enrichBookMetadata(parsed.data);
    return NextResponse.json(enrichment);
  } catch (error) {
    return handleApiError(error);
  }
}
