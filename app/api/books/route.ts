import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/api/errors';
import { parseJsonBody } from '@/lib/api/request';
import { requireApiUser } from '@/lib/auth/api-auth';
import { requireRole } from '@/lib/auth/permissions';
import { booksQuerySchema, bookWriteSchema } from '@/lib/schemas/book';
import { createBook, searchBooks } from '@/lib/services/books';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireApiUser(request);

    const tags =
      request.nextUrl.searchParams
        .get('tags')
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) ?? [];

    const parsedQuery = booksQuerySchema.safeParse({
      q: request.nextUrl.searchParams.get('q') ?? undefined,
      author: request.nextUrl.searchParams.get('author') ?? undefined,
      genre: request.nextUrl.searchParams.get('genre') ?? undefined,
      tags,
      availability: request.nextUrl.searchParams.get('availability') ?? undefined,
      page: request.nextUrl.searchParams.get('page') ?? undefined,
      limit: request.nextUrl.searchParams.get('limit') ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: parsedQuery.error.issues[0]?.message ?? 'Invalid query' },
        { status: 400 },
      );
    }

    const result = await searchBooks(parsedQuery.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireApiUser(request);
    requireRole(user, 'admin');

    const body = await parseJsonBody(request);
    const parsedBody = bookWriteSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 },
      );
    }

    const created = await createBook(parsedBody.data, user.uid);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
