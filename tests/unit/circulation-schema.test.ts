import { describe, expect, it } from 'vitest';

import { checkoutSchema } from '@/lib/schemas/circulation';

describe('checkoutSchema', () => {
  it('accepts payload with dueDays', () => {
    const parsed = checkoutSchema.safeParse({
      bookId: 'book-1',
      dueDays: 14,
    });

    expect(parsed.success).toBe(true);
  });

  it('accepts payload with dueDate only', () => {
    const parsed = checkoutSchema.safeParse({
      bookId: 'book-1',
      dueDate: '2030-01-01T00:00:00.000Z',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects payload that includes both dueDays and dueDate', () => {
    const parsed = checkoutSchema.safeParse({
      bookId: 'book-1',
      dueDays: 14,
      dueDate: '2030-01-01T00:00:00.000Z',
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) {
      throw new Error('Expected schema validation to fail');
    }

    expect(parsed.error.issues[0]?.message).toContain('either dueDays or dueDate');
  });
});
