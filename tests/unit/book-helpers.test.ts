import { describe, expect, it } from 'vitest';

import { normalizeTags, createSearchBlob } from '@/lib/services/book-utils';

describe('book helpers', () => {
  it('normalizes tags to title case and removes duplicates', () => {
    expect(normalizeTags([' sciFi ', 'history', 'HISTORY'])).toEqual(['Scifi', 'History']);
  });

  it('creates a lower-cased search blob', () => {
    const blob = createSearchBlob({
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      genre: 'Technology',
      tags: ['Software', 'Career'],
      isbn: '123-456',
    });

    expect(blob).toContain('pragmatic');
    expect(blob).toContain('technology');
    expect(blob).toContain('123-456');
  });
});
