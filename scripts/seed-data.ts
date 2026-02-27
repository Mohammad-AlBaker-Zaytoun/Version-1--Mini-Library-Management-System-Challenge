import { createSearchBlob, normalizeTags } from '@/lib/services/book-utils';
import type { Book, CirculationTransaction, UserProfile } from '@/lib/types';

import type { SeedDocument } from './seed-utils';

export const SEED_COLLECTIONS = {
  users: 'users',
  books: 'books',
  transactions: 'circulationTransactions',
} as const;

export const SEED_USER_IDS = {
  admin: 'seed-admin-001',
  member1: 'seed-member-001',
  member2: 'seed-member-002',
  member3: 'seed-member-003',
} as const;

export interface SeedDataset {
  generatedAtIso: string;
  users: Array<SeedDocument<UserProfile>>;
  books: Array<SeedDocument<Book>>;
  transactions: Array<SeedDocument<CirculationTransaction>>;
}

const TITLE_PREFIXES = [
  'Midnight',
  'Silent',
  'Hidden',
  'Burning',
  'Fractured',
  'Golden',
  'Rusted',
  'Crimson',
  'Echoing',
  'Shifting',
];

const TITLE_TOPICS = ['Archive', 'Harbor', 'Compass'];

const AUTHORS = [
  'Amelia Ward',
  'Jonas Pike',
  'Priya Raman',
  'Daniel Brooks',
  'Layla Carter',
  'Noah Bennett',
  'Sofia Hayes',
  'Ethan Rivers',
  'Mila Novak',
  'Caleb Stone',
  'Ivy Dalton',
  'Owen Price',
  'Aria Sinclair',
  'Luca Turner',
  'Nora Ellis',
];

const GENRES = [
  'Literary Fiction',
  'Science Fiction',
  'Mystery',
  'History',
  'Biography',
  'Technology',
];

function addDays(baseDate: Date, days: number): string {
  const next = new Date(baseDate);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}

function addDaysToIso(isoDate: string, days: number): string {
  return addDays(new Date(isoDate), days);
}

function getCheckedOutBorrowedAt(baseDate: Date, index: number): string {
  return addDays(baseDate, -(25 - index));
}

function getCheckedOutDueDate(baseDate: Date, index: number): string {
  if (index < 5) {
    return addDays(baseDate, -(6 - index));
  }

  return addDays(baseDate, index - 2);
}

function getHistoryCheckoutAt(baseDate: Date, index: number): string {
  return addDays(baseDate, -(90 - index));
}

function getHistoryCheckinAt(baseDate: Date, index: number): string {
  return addDays(baseDate, -(75 - index));
}

function buildUsers(nowIso: string): Array<SeedDocument<UserProfile>> {
  return [
    {
      id: SEED_USER_IDS.admin,
      data: {
        uid: SEED_USER_IDS.admin,
        email: 'seed.admin@library.demo',
        displayName: 'Seed Admin',
        role: 'admin',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      },
    },
    {
      id: SEED_USER_IDS.member1,
      data: {
        uid: SEED_USER_IDS.member1,
        email: 'seed.member.one@library.demo',
        displayName: 'Seed Member One',
        role: 'member',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      },
    },
    {
      id: SEED_USER_IDS.member2,
      data: {
        uid: SEED_USER_IDS.member2,
        email: 'seed.member.two@library.demo',
        displayName: 'Seed Member Two',
        role: 'member',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      },
    },
    {
      id: SEED_USER_IDS.member3,
      data: {
        uid: SEED_USER_IDS.member3,
        email: 'seed.member.three@library.demo',
        displayName: 'Seed Member Three',
        role: 'member',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      },
    },
  ];
}

function getMemberUidByIndex(index: number): string {
  const memberIds = [SEED_USER_IDS.member1, SEED_USER_IDS.member2, SEED_USER_IDS.member3];
  return memberIds[index % memberIds.length];
}

function getMemberDisplayNameByUid(uid: string): string {
  if (uid === SEED_USER_IDS.member1) {
    return 'Seed Member One';
  }
  if (uid === SEED_USER_IDS.member2) {
    return 'Seed Member Two';
  }
  return 'Seed Member Three';
}

function buildBooks(baseDate: Date): Array<SeedDocument<Book>> {
  const books: Array<SeedDocument<Book>> = [];

  for (let index = 0; index < 30; index += 1) {
    const bookNumber = String(index + 1).padStart(3, '0');
    const bookId = `book-${bookNumber}`;
    const topic = TITLE_TOPICS[Math.floor(index / 10)];
    const title = `${TITLE_PREFIXES[index % TITLE_PREFIXES.length]} ${topic}`;
    const author = AUTHORS[index % AUTHORS.length];
    const genre = GENRES[index % GENRES.length];
    const tags = normalizeTags([
      genre,
      'Library Pick',
      topic,
      index % 2 === 0 ? 'Staff Favorite' : 'Community Favorite',
    ]);

    const createdAt = addDays(baseDate, -(365 - index * 3));
    const isCheckedOut = index < 12;
    const hasClosedHistory = index >= 12 && index < 26;

    const borrowedByUid = isCheckedOut ? getMemberUidByIndex(index) : undefined;
    const borrowedByName = borrowedByUid ? getMemberDisplayNameByUid(borrowedByUid) : undefined;
    const borrowedAt = isCheckedOut ? getCheckedOutBorrowedAt(baseDate, index) : undefined;
    const dueDate = isCheckedOut ? getCheckedOutDueDate(baseDate, index) : undefined;

    const updatedAt = isCheckedOut
      ? borrowedAt
      : hasClosedHistory
        ? getHistoryCheckinAt(baseDate, index)
        : addDays(baseDate, -(40 - index));

    const aiSummary =
      index % 4 === 0
        ? `${title} follows a high-stakes journey where memory, identity, and social pressure collide.`
        : undefined;
    const aiSuggestedGenre = index % 4 === 0 ? genre : undefined;

    const book: Book = {
      id: bookId,
      title,
      author,
      isbn: `978-1-4028-${String(1000 + index).padStart(4, '0')}-${index % 9}`,
      genre,
      publishedYear: 1988 + (index % 30),
      coverUrl: index % 3 === 0 ? `https://images.example.com/covers/${bookId}.jpg` : undefined,
      description: `${title} by ${author} explores difficult choices through a modern library-ready narrative.`,
      aiSummary,
      aiSuggestedGenre,
      tags,
      searchBlob: createSearchBlob({
        title,
        author,
        genre,
        isbn: `978-1-4028-${String(1000 + index).padStart(4, '0')}-${index % 9}`,
        tags,
      }),
      availability: isCheckedOut ? 'checked_out' : 'available',
      borrowedByUid,
      borrowedByName,
      borrowedAt,
      dueDate,
      createdAt,
      updatedAt: updatedAt ?? createdAt,
      createdByUid: SEED_USER_IDS.admin,
      updatedByUid: SEED_USER_IDS.admin,
    };

    books.push({
      id: bookId,
      data: book,
    });
  }

  return books;
}

function buildTransactions(baseDate: Date): Array<SeedDocument<CirculationTransaction>> {
  const transactions: Array<SeedDocument<CirculationTransaction>> = [];
  let txNumber = 1;

  const pushTransaction = (data: Omit<CirculationTransaction, 'id'>): void => {
    const txId = `tx-${String(txNumber).padStart(3, '0')}`;
    txNumber += 1;
    transactions.push({
      id: txId,
      data: {
        id: txId,
        ...data,
      },
    });
  };

  // 14 books that have completed checkout/checkin cycles -> 28 transactions.
  for (let index = 12; index < 26; index += 1) {
    const bookId = `book-${String(index + 1).padStart(3, '0')}`;
    const topic = TITLE_TOPICS[Math.floor(index / 10)];
    const title = `${TITLE_PREFIXES[index % TITLE_PREFIXES.length]} ${topic}`;
    const memberUid = getMemberUidByIndex(index);
    const memberName = getMemberDisplayNameByUid(memberUid);
    const checkoutAt = getHistoryCheckoutAt(baseDate, index);
    const checkinAt = getHistoryCheckinAt(baseDate, index);
    const checkoutActorUid = index % 2 === 0 ? SEED_USER_IDS.admin : memberUid;
    const checkoutActorName = checkoutActorUid === SEED_USER_IDS.admin ? 'Seed Admin' : memberName;

    pushTransaction({
      bookId,
      bookTitle: title,
      action: 'checkout',
      memberUid,
      memberName,
      actorUid: checkoutActorUid,
      actorName: checkoutActorName,
      dueDate: addDaysToIso(checkoutAt, 14),
      createdAt: checkoutAt,
    });

    pushTransaction({
      bookId,
      bookTitle: title,
      action: 'checkin',
      memberUid,
      memberName,
      actorUid: memberUid,
      actorName: memberName,
      createdAt: checkinAt,
    });
  }

  // 12 books currently checked out -> 12 checkout transactions.
  for (let index = 0; index < 12; index += 1) {
    const bookId = `book-${String(index + 1).padStart(3, '0')}`;
    const topic = TITLE_TOPICS[Math.floor(index / 10)];
    const title = `${TITLE_PREFIXES[index % TITLE_PREFIXES.length]} ${topic}`;
    const memberUid = getMemberUidByIndex(index);
    const memberName = getMemberDisplayNameByUid(memberUid);
    const borrowedAt = getCheckedOutBorrowedAt(baseDate, index);
    const dueDate = getCheckedOutDueDate(baseDate, index);
    const actorUid = index < 8 ? SEED_USER_IDS.admin : memberUid;
    const actorName = actorUid === SEED_USER_IDS.admin ? 'Seed Admin' : memberName;

    pushTransaction({
      bookId,
      bookTitle: title,
      action: 'checkout',
      memberUid,
      memberName,
      actorUid,
      actorName,
      dueDate,
      createdAt: borrowedAt,
    });
  }

  return transactions;
}

export function buildSeedDataset(baseDate = new Date()): SeedDataset {
  const generatedAtIso = baseDate.toISOString();
  const users = buildUsers(generatedAtIso);
  const books = buildBooks(baseDate);
  const transactions = buildTransactions(baseDate);

  return {
    generatedAtIso,
    users,
    books,
    transactions,
  };
}
