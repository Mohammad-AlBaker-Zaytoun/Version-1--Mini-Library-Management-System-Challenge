import { describe, expect, it } from 'vitest';

import { filterBooks } from '@/lib/services/search';
import type { Book } from '@/lib/types';

function makeBook(partial: Partial<Book>): Book {
  return {
    id: partial.id ?? 'book-id',
    title: partial.title ?? 'Default title',
    author: partial.author ?? 'Default author',
    tags: partial.tags ?? [],
    searchBlob: partial.searchBlob ?? 'default title default author',
    availability: partial.availability ?? 'available',
    createdAt: partial.createdAt ?? '2025-01-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2025-01-01T00:00:00.000Z',
    createdByUid: partial.createdByUid ?? 'admin-1',
    updatedByUid: partial.updatedByUid ?? 'admin-1',
    isbn: partial.isbn,
    genre: partial.genre,
    publishedYear: partial.publishedYear,
    coverUrl: partial.coverUrl,
    description: partial.description,
    aiSummary: partial.aiSummary,
    aiSuggestedGenre: partial.aiSuggestedGenre,
    borrowedByUid: partial.borrowedByUid,
    borrowedByName: partial.borrowedByName,
    borrowedAt: partial.borrowedAt,
    dueDate: partial.dueDate,
  };
}

describe('filterBooks', () => {
  it('filters by tags with case-insensitive matching', () => {
    const books = [
      makeBook({
        id: 'book-1',
        title: 'The Pragmatic Programmer',
        author: 'Andy Hunt',
        tags: ['Software', 'Engineering'],
        searchBlob: 'the pragmatic programmer andy hunt software engineering',
      }),
      makeBook({
        id: 'book-2',
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        tags: ['Architecture'],
        searchBlob: 'clean architecture robert c martin architecture',
      }),
    ];

    const filtered = filterBooks(books, {
      q: undefined,
      author: undefined,
      genre: undefined,
      tags: ['software'],
      availability: undefined,
      overdueOnly: undefined,
      page: 1,
      limit: 10,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('book-1');
  });

  it('filters overdue loans only when overdueOnly is true', () => {
    const books = [
      makeBook({
        id: 'book-overdue',
        title: 'Overdue Book',
        author: 'A',
        availability: 'checked_out',
        dueDate: '2020-01-01T00:00:00.000Z',
        borrowedByUid: 'member-1',
        borrowedByName: 'Member 1',
      }),
      makeBook({
        id: 'book-active',
        title: 'Active Loan',
        author: 'B',
        availability: 'checked_out',
        dueDate: '2100-01-01T00:00:00.000Z',
        borrowedByUid: 'member-2',
        borrowedByName: 'Member 2',
      }),
      makeBook({
        id: 'book-available',
        title: 'Available',
        author: 'C',
        availability: 'available',
      }),
    ];

    const filtered = filterBooks(books, {
      q: undefined,
      author: undefined,
      genre: undefined,
      tags: [],
      availability: undefined,
      overdueOnly: true,
      page: 1,
      limit: 10,
    });

    expect(filtered.map((book) => book.id)).toEqual(['book-overdue']);
  });
});
