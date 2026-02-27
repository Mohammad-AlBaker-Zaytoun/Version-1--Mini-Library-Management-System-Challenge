import { describe, expect, it } from 'vitest';

import { DEFAULT_BOOK_COVER_URL, getBookCoverUrl } from '@/lib/books/cover';

describe('book cover helper', () => {
  it('returns fallback URL for empty values', () => {
    expect(getBookCoverUrl()).toBe(DEFAULT_BOOK_COVER_URL);
    expect(getBookCoverUrl('')).toBe(DEFAULT_BOOK_COVER_URL);
    expect(getBookCoverUrl('   ')).toBe(DEFAULT_BOOK_COVER_URL);
    expect(getBookCoverUrl(null)).toBe(DEFAULT_BOOK_COVER_URL);
  });

  it('returns normalized provided URL when available', () => {
    expect(getBookCoverUrl(' https://example.com/cover.jpg ')).toBe(
      'https://example.com/cover.jpg',
    );
  });
});
