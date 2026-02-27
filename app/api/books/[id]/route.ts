import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { parseJsonBody } from '@/lib/api/request';
import { requireApiUser } from '@/lib/auth/api-auth';
import { requireRole } from '@/lib/auth/permissions';
import { bookUpdateSchema } from '@/lib/schemas/book';
import { deleteBook, getBookById, updateBook } from '@/lib/services/books';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireApiUser(request);

    const { id } = await context.params;
    const book = await getBookById(id);
    return NextResponse.json(book);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    requireRole(user, 'admin');

    const body = await parseJsonBody(request);
    const parsedBody = bookUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const updated = await updateBook(id, parsedBody.data, user.uid);
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    requireRole(user, 'admin');

    const { id } = await context.params;
    await deleteBook(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
