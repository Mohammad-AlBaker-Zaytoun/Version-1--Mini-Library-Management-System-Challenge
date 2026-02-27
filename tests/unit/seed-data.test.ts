import { describe, expect, it } from 'vitest';

import { buildSeedDataset } from '../../scripts/seed-data';

const REFERENCE_NOW = new Date('2026-02-27T12:00:00.000Z');

describe('seed dataset integrity', () => {
  it('matches expected profile sizes and deterministic IDs', () => {
    const dataset = buildSeedDataset(REFERENCE_NOW);

    expect(dataset.users).toHaveLength(4);
    expect(dataset.books).toHaveLength(30);
    expect(dataset.circulationTransactions).toHaveLength(40);

    expect(dataset.users.map((user) => user.uid)).toEqual([
      'seed-admin-001',
      'seed-member-001',
      'seed-member-002',
      'seed-member-003',
    ]);
    expect(dataset.books[0]?.id).toBe('book-001');
    expect(dataset.books[29]?.id).toBe('book-030');
    expect(dataset.circulationTransactions[0]?.id).toBe('tx-001');
    expect(dataset.circulationTransactions[39]?.id).toBe('tx-040');
  });

  it('contains no dangling references', () => {
    const dataset = buildSeedDataset(REFERENCE_NOW);
    const userIds = new Set(dataset.users.map((user) => user.uid));
    const bookIds = new Set(dataset.books.map((book) => book.id));

    for (const transaction of dataset.circulationTransactions) {
      expect(bookIds.has(transaction.bookId)).toBe(true);
      expect(userIds.has(transaction.memberUid)).toBe(true);
      expect(userIds.has(transaction.actorUid)).toBe(true);
    }
  });

  it('keeps final availability consistent with latest transaction', () => {
    const dataset = buildSeedDataset(REFERENCE_NOW);
    const transactionsByBook = new Map<string, typeof dataset.circulationTransactions>();

    for (const transaction of dataset.circulationTransactions) {
      const list = transactionsByBook.get(transaction.bookId) ?? [];
      list.push(transaction);
      transactionsByBook.set(transaction.bookId, list);
    }

    for (const book of dataset.books) {
      const history = [...(transactionsByBook.get(book.id) ?? [])].sort((first, second) =>
        first.createdAt.localeCompare(second.createdAt),
      );
      const lastTransaction = history.at(-1);

      if (book.availability === 'checked_out') {
        expect(lastTransaction?.action).toBe('checkout');
        expect(book.borrowedByUid).toBeTruthy();
        expect(book.borrowedByName).toBeTruthy();
        expect(book.borrowedAt).toBeTruthy();
        expect(book.dueDate).toBeTruthy();
      } else if (lastTransaction) {
        expect(lastTransaction.action).toBe('checkin');
      }
    }

    const checkedOut = dataset.books.filter((book) => book.availability === 'checked_out');
    const available = dataset.books.filter((book) => book.availability === 'available');
    const overdue = checkedOut.filter((book) => {
      if (!book.dueDate) {
        return false;
      }

      return new Date(book.dueDate).getTime() < REFERENCE_NOW.getTime();
    });

    expect(checkedOut).toHaveLength(12);
    expect(available).toHaveLength(18);
    expect(overdue).toHaveLength(5);
  });
});
