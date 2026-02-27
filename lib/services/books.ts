import { getAdminDb } from '@/lib/firebase/admin';
import type { Book, BooksListResponse } from '@/lib/types';
import type { BookUpdateInput, BookWriteInput, BooksQueryInput } from '@/lib/schemas/book';
import { notFound } from '@/lib/api/errors';
import { nowIso } from '@/lib/utils';
import { filterBooks, paginate } from '@/lib/services/search';
import { createSearchBlob, normalizeTags } from '@/lib/services/book-utils';

const BOOKS_COLLECTION = 'books';

function normalizeOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function createBook(input: BookWriteInput, actorUid: string): Promise<Book> {
  const now = nowIso();
  const tags = normalizeTags(input.tags);
  const docRef = getAdminDb().collection(BOOKS_COLLECTION).doc();

  const book: Book = {
    id: docRef.id,
    title: input.title.trim(),
    author: input.author.trim(),
    isbn: normalizeOptional(input.isbn),
    genre: normalizeOptional(input.genre),
    publishedYear: input.publishedYear,
    coverUrl: normalizeOptional(input.coverUrl),
    description: normalizeOptional(input.description),
    aiSummary: normalizeOptional(input.aiSummary),
    aiSuggestedGenre: normalizeOptional(input.aiSuggestedGenre),
    tags,
    searchBlob: createSearchBlob({
      title: input.title,
      author: input.author,
      genre: input.genre,
      isbn: input.isbn,
      tags,
    }),
    availability: 'available',
    createdAt: now,
    updatedAt: now,
    createdByUid: actorUid,
    updatedByUid: actorUid,
  };

  await docRef.set(book);
  return book;
}

export async function getBookById(bookId: string): Promise<Book> {
  const snapshot = await getAdminDb().collection(BOOKS_COLLECTION).doc(bookId).get();
  if (!snapshot.exists) {
    notFound('Book not found');
  }

  return snapshot.data() as Book;
}

export async function updateBook(
  bookId: string,
  input: BookUpdateInput,
  actorUid: string,
): Promise<Book> {
  const existing = await getBookById(bookId);
  const tags = input.tags ? normalizeTags(input.tags) : existing.tags;

  const merged: Book = {
    ...existing,
    ...Object.fromEntries(
      Object.entries({
        title: input.title?.trim(),
        author: input.author?.trim(),
        isbn: normalizeOptional(input.isbn),
        genre: normalizeOptional(input.genre),
        publishedYear: input.publishedYear,
        coverUrl: normalizeOptional(input.coverUrl),
        description: normalizeOptional(input.description),
        aiSummary: normalizeOptional(input.aiSummary),
        aiSuggestedGenre: normalizeOptional(input.aiSuggestedGenre),
      }).filter(([, value]) => value !== undefined),
    ),
    tags,
    searchBlob: createSearchBlob({
      title: input.title ?? existing.title,
      author: input.author ?? existing.author,
      genre: input.genre ?? existing.genre,
      isbn: input.isbn ?? existing.isbn,
      tags,
    }),
    updatedAt: nowIso(),
    updatedByUid: actorUid,
  };

  await getAdminDb().collection(BOOKS_COLLECTION).doc(bookId).set(merged, { merge: true });
  return merged;
}

export async function deleteBook(bookId: string): Promise<void> {
  await getBookById(bookId);
  await getAdminDb().collection(BOOKS_COLLECTION).doc(bookId).delete();
}

export async function searchBooks(query: BooksQueryInput): Promise<BooksListResponse> {
  const snapshot = await getAdminDb()
    .collection(BOOKS_COLLECTION)
    .orderBy('updatedAt', 'desc')
    .limit(500)
    .get();

  const allBooks = snapshot.docs.map((doc) => doc.data() as Book);
  const filtered = filterBooks(allBooks, query);
  const paginated = paginate(filtered, query.page, query.limit);

  return {
    items: paginated.slicedItems,
    page: paginated.page,
    limit: query.limit,
    total: paginated.total,
    totalPages: paginated.totalPages,
  };
}
