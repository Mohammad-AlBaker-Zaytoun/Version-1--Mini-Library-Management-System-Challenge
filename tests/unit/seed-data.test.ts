import { describe, expect, it } from 'vitest';

import { buildSeedDataset, SEED_USER_IDS } from '@/scripts/seed-data';

describe('seed dataset integrity', () => {
  const referenceNow = new Date('2026-02-20T12:00:00.000Z');
  const dataset = buildSeedDataset(referenceNow);

  it('produces exact deterministic dataset sizes and ids', () => {
    expect(dataset.users).toHaveLength(4);
    expect(dataset.books).toHaveLength(30);
    expect(dataset.transactions).toHaveLength(40);

    expect(dataset.users.map((entry) => entry.id)).toEqual([
      SEED_USER_IDS.admin,
      SEED_USER_IDS.member1,
      SEED_USER_IDS.member2,
      SEED_USER_IDS.member3,
    ]);

    expect(dataset.books[0]?.id).toBe('book-001');
    expect(dataset.books[29]?.id).toBe('book-030');
    expect(dataset.transactions[0]?.id).toBe('tx-001');
    expect(dataset.transactions[39]?.id).toBe('tx-040');
  });

  it('has no dangling references in transactions', () => {
    const userIds = new Set(dataset.users.map((entry) => entry.id));
    const bookIds = new Set(dataset.books.map((entry) => entry.id));

    for (const entry of dataset.transactions) {
      expect(bookIds.has(entry.data.bookId)).toBe(true);
      expect(userIds.has(entry.data.memberUid)).toBe(true);
      expect(userIds.has(entry.data.actorUid)).toBe(true);
    }
  });

  it('maintains consistent final availability with latest transaction action', () => {
    const latestActionByBook = new Map<
      string,
      { action: 'checkout' | 'checkin'; createdAt: string }
    >();
    for (const txEntry of dataset.transactions) {
      const current = latestActionByBook.get(txEntry.data.bookId);
      if (!current || txEntry.data.createdAt > current.createdAt) {
        latestActionByBook.set(txEntry.data.bookId, {
          action: txEntry.data.action,
          createdAt: txEntry.data.createdAt,
        });
      }
    }

    for (const bookEntry of dataset.books) {
      const latestAction = latestActionByBook.get(bookEntry.id);
      if (bookEntry.data.availability === 'checked_out') {
        expect(latestAction?.action).toBe('checkout');
        expect(bookEntry.data.borrowedByUid).toBeTruthy();
        expect(bookEntry.data.borrowedByName).toBeTruthy();
        expect(bookEntry.data.borrowedAt).toBeTruthy();
        expect(bookEntry.data.dueDate).toBeTruthy();
      } else if (latestAction) {
        expect(latestAction.action).toBe('checkin');
      }
    }
  });

  it('contains 12 checked-out books with 5 overdue and 7 active loans', () => {
    const checkedOutBooks = dataset.books.filter(
      (book) => book.data.availability === 'checked_out',
    );
    expect(checkedOutBooks).toHaveLength(12);

    const nowTime = referenceNow.getTime();
    const overdueCount = checkedOutBooks.filter((book) => {
      const dueDate = book.data.dueDate;
      return dueDate ? new Date(dueDate).getTime() < nowTime : false;
    }).length;
    const activeCount = checkedOutBooks.filter((book) => {
      const dueDate = book.data.dueDate;
      return dueDate ? new Date(dueDate).getTime() > nowTime : false;
    }).length;

    expect(overdueCount).toBe(5);
    expect(activeCount).toBe(7);
  });
});
