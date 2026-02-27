import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { requireApiUser } from '@/lib/auth/api-auth';
import { checkoutSchema } from '@/lib/schemas/circulation';
import { checkoutBook } from '@/lib/services/circulation';
import { parseJsonBody } from '@/lib/api/request';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);

    const body = await parseJsonBody(request);
    const parsedBody = checkoutSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const result = await checkoutBook({
      bookId: parsedBody.data.bookId,
      memberUid: parsedBody.data.memberUid ?? user.uid,
      loanDays: parsedBody.data.loanDays,
      actor: user,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
