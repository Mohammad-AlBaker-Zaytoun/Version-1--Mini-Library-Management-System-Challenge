import { describe, expect, it } from 'vitest';

import { filterBooks, paginate } from '@/lib/services/search';
import type { Book } from '@/lib/types';

const baseBook = {
  availability: 'available' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdByUid: 'admin-1',
  updatedByUid: 'admin-1',
  searchBlob: '',
  tags: [],
};

const books: Book[] = [
  {
    ...baseBook,
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self Help',
    searchBlob: 'atomic habits james clear self help productivity',
  },
  {
    ...baseBook,
    id: '2',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    genre: 'Technology',
    searchBlob: 'designing data intensive applications martin kleppmann technology systems',
  },
  {
    ...baseBook,
    id: '3',
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Science Fiction',
    searchBlob: 'dune frank herbert science fiction classic',
    availability: 'checked_out',
    borrowedByUid: 'member-1',
    borrowedByName: 'Member One',
    borrowedAt: '2026-01-15T00:00:00.000Z',
    dueDate: '2026-01-29T00:00:00.000Z',
  },
];

describe('search integration', () => {
  it('filters by text and availability', () => {
    const filtered = filterBooks(books, {
      q: 'dune',
      author: undefined,
      genre: undefined,
      availability: 'checked_out',
      page: 1,
      limit: 10,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe('Dune');
  });

  it('paginates deterministic slices', () => {
    const paginated = paginate(books, 2, 2);
    expect(paginated.page).toBe(2);
    expect(paginated.totalPages).toBe(2);
    expect(paginated.slicedItems).toHaveLength(1);
    expect(paginated.slicedItems[0]?.id).toBe('3');
  });
});
