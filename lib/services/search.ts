import type { Book } from '@/lib/types';
import type { BooksQueryInput } from '@/lib/schemas/book';

export function filterBooks(items: Book[], query: BooksQueryInput): Book[] {
  return items.filter((book) => {
    const q = query.q?.toLowerCase();
    const author = query.author?.toLowerCase();
    const genre = query.genre?.toLowerCase();

    const matchesQ = !q || book.searchBlob.includes(q);
    const matchesAuthor = !author || book.author.toLowerCase().includes(author);
    const matchesGenre = !genre || (book.genre ?? '').toLowerCase().includes(genre);
    const matchesAvailability = !query.availability || book.availability === query.availability;

    return matchesQ && matchesAuthor && matchesGenre && matchesAvailability;
  });
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): {
  page: number;
  totalPages: number;
  total: number;
  slicedItems: T[];
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;

  return {
    page: safePage,
    totalPages,
    total,
    slicedItems: items.slice(start, start + limit),
  };
}
