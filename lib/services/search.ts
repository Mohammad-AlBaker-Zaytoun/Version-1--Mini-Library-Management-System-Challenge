import type { Book } from '@/lib/types';
import type { BooksQueryInput } from '@/lib/schemas/book';

function isOverdue(iso: string | undefined): boolean {
  if (!iso) {
    return false;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

export function filterBooks(items: Book[], query: BooksQueryInput): Book[] {
  const queryTags = query.tags.map((tag) => tag.toLowerCase());

  return items.filter((book) => {
    const q = query.q?.toLowerCase();
    const author = query.author?.toLowerCase();
    const genre = query.genre?.toLowerCase();
    const bookTags = book.tags.map((tag) => tag.toLowerCase());

    const matchesQ = !q || book.searchBlob.includes(q);
    const matchesAuthor = !author || book.author.toLowerCase().includes(author);
    const matchesGenre = !genre || (book.genre ?? '').toLowerCase().includes(genre);
    const matchesTags = queryTags.length === 0 || queryTags.every((tag) => bookTags.includes(tag));
    const matchesAvailability = !query.availability || book.availability === query.availability;
    const matchesOverdueOnly =
      !query.overdueOnly || (book.availability === 'checked_out' && isOverdue(book.dueDate));

    return (
      matchesQ &&
      matchesAuthor &&
      matchesGenre &&
      matchesTags &&
      matchesAvailability &&
      matchesOverdueOnly
    );
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
