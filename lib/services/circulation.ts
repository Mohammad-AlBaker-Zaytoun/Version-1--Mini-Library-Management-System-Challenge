import { FieldValue } from 'firebase-admin/firestore';

import { badRequest, forbidden, notFound } from '@/lib/api/errors';
import { canActOnMember } from '@/lib/auth/permissions';
import { getAdminDb } from '@/lib/firebase/admin';
import type { CheckinInput, CheckoutInput, CirculationHistoryQueryInput } from '@/lib/schemas/circulation';
import { paginate } from '@/lib/services/search';
import { getUserProfile } from '@/lib/services/users';
import type {
  ApiUserContext,
  Book,
  CirculationHistoryResponse,
  CirculationMutationResponse,
  CirculationTransaction,
  UserProfile,
} from '@/lib/types';

const BOOKS_COLLECTION = 'books';
const TRANSACTIONS_COLLECTION = 'circulationTransactions';
const DEFAULT_DUE_DAYS = 14;

function resolveDueDate(input: CheckoutInput, now: Date): string {
  if (input.dueDate) {
    const parsed = new Date(input.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      badRequest('Invalid dueDate value');
    }

    if (parsed.getTime() <= now.getTime()) {
      badRequest('dueDate must be in the future');
    }

    return parsed.toISOString();
  }

  const dueDays = input.dueDays ?? DEFAULT_DUE_DAYS;
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate.toISOString();
}

async function resolveTargetMember(memberUid: string | undefined, actor: ApiUserContext): Promise<UserProfile> {
  const targetUid = memberUid?.trim() || actor.uid;

  if (!canActOnMember(targetUid, actor)) {
    forbidden('Members can only perform circulation actions for themselves');
  }

  const memberProfile = await getUserProfile(targetUid);
  if (!memberProfile) {
    notFound('Target member profile was not found');
  }

  return memberProfile;
}

function sortTransactionsByNewest(items: CirculationTransaction[]): CirculationTransaction[] {
  return [...items].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export async function checkoutBook(
  input: CheckoutInput,
  actor: ApiUserContext,
): Promise<CirculationMutationResponse> {
  const memberProfile = await resolveTargetMember(input.memberUid, actor);
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const dueDate = resolveDueDate(input, nowDate);

  const db = getAdminDb();
  const bookRef = db.collection(BOOKS_COLLECTION).doc(input.bookId);
  const transactionRef = db.collection(TRANSACTIONS_COLLECTION).doc();

  let updatedBook: Book | null = null;
  let transactionEntry: CirculationTransaction | null = null;

  await db.runTransaction(async (transaction) => {
    const bookSnapshot = await transaction.get(bookRef);
    if (!bookSnapshot.exists) {
      notFound('Book not found');
    }

    const currentBook = bookSnapshot.data() as Book;
    if (currentBook.availability === 'checked_out') {
      badRequest('Book is already checked out');
    }

    updatedBook = {
      ...currentBook,
      availability: 'checked_out',
      borrowedByUid: memberProfile.uid,
      borrowedByName: memberProfile.displayName,
      borrowedAt: now,
      dueDate,
      updatedAt: now,
      updatedByUid: actor.uid,
    };

    transaction.update(bookRef, {
      availability: 'checked_out',
      borrowedByUid: memberProfile.uid,
      borrowedByName: memberProfile.displayName,
      borrowedAt: now,
      dueDate,
      updatedAt: now,
      updatedByUid: actor.uid,
    });

    const createdTransaction: CirculationTransaction = {
      id: transactionRef.id,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      action: 'checkout',
      memberUid: memberProfile.uid,
      memberName: memberProfile.displayName,
      actorUid: actor.uid,
      actorName: actor.displayName,
      dueDate,
      createdAt: now,
    };

    transactionEntry = createdTransaction;
    transaction.set(transactionRef, createdTransaction);
  });

  if (!updatedBook || !transactionEntry) {
    throw new Error('Failed to create checkout transaction');
  }

  return {
    book: updatedBook,
    transaction: transactionEntry,
  };
}

export async function checkinBook(
  input: CheckinInput,
  actor: ApiUserContext,
): Promise<CirculationMutationResponse> {
  if (input.memberUid && !canActOnMember(input.memberUid, actor)) {
    forbidden('Members can only perform circulation actions for themselves');
  }

  const now = new Date().toISOString();
  const db = getAdminDb();
  const bookRef = db.collection(BOOKS_COLLECTION).doc(input.bookId);
  const transactionRef = db.collection(TRANSACTIONS_COLLECTION).doc();

  let updatedBook: Book | null = null;
  let transactionEntry: CirculationTransaction | null = null;

  await db.runTransaction(async (transaction) => {
    const bookSnapshot = await transaction.get(bookRef);
    if (!bookSnapshot.exists) {
      notFound('Book not found');
    }

    const currentBook = bookSnapshot.data() as Book;
    if (currentBook.availability === 'available') {
      badRequest('Book is already checked in');
    }

    const borrowerUid = currentBook.borrowedByUid;
    const borrowerName = currentBook.borrowedByName;

    if (!borrowerUid || !borrowerName) {
      badRequest('Current borrower information is missing for this book');
    }

    if (!canActOnMember(borrowerUid, actor)) {
      forbidden('Members can only check in books they borrowed');
    }

    if (actor.role === 'admin' && input.memberUid && input.memberUid !== borrowerUid) {
      badRequest('Provided memberUid does not match current borrower');
    }

    updatedBook = {
      ...currentBook,
      availability: 'available',
      borrowedByUid: undefined,
      borrowedByName: undefined,
      borrowedAt: undefined,
      dueDate: undefined,
      updatedAt: now,
      updatedByUid: actor.uid,
    };

    transaction.update(bookRef, {
      availability: 'available',
      borrowedByUid: FieldValue.delete(),
      borrowedByName: FieldValue.delete(),
      borrowedAt: FieldValue.delete(),
      dueDate: FieldValue.delete(),
      updatedAt: now,
      updatedByUid: actor.uid,
    });

    const createdTransaction: CirculationTransaction = {
      id: transactionRef.id,
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      action: 'checkin',
      memberUid: borrowerUid,
      memberName: borrowerName,
      actorUid: actor.uid,
      actorName: actor.displayName,
      createdAt: now,
    };

    transactionEntry = createdTransaction;
    transaction.set(transactionRef, createdTransaction);
  });

  if (!updatedBook || !transactionEntry) {
    throw new Error('Failed to create checkin transaction');
  }

  return {
    book: updatedBook,
    transaction: transactionEntry,
  };
}

export async function getCirculationHistory(
  query: CirculationHistoryQueryInput,
  actor: ApiUserContext,
): Promise<CirculationHistoryResponse> {
  const db = getAdminDb();
  const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

  let transactions: CirculationTransaction[];
  if (actor.role === 'admin') {
    const snapshot = await transactionsCollection.orderBy('createdAt', 'desc').limit(1000).get();
    transactions = snapshot.docs.map((doc) => doc.data() as CirculationTransaction);

    if (query.memberUid) {
      transactions = transactions.filter((entry) => entry.memberUid === query.memberUid);
    }
  } else {
    const snapshot = await transactionsCollection.where('memberUid', '==', actor.uid).limit(1000).get();
    transactions = sortTransactionsByNewest(
      snapshot.docs.map((doc) => doc.data() as CirculationTransaction),
    );
  }

  if (query.action) {
    transactions = transactions.filter((entry) => entry.action === query.action);
  }

  if (query.bookId) {
    transactions = transactions.filter((entry) => entry.bookId === query.bookId);
  }

  const paginated = paginate(transactions, query.page, query.limit);

  return {
    items: paginated.slicedItems,
    page: paginated.page,
    limit: query.limit,
    total: paginated.total,
    totalPages: paginated.totalPages,
  };
}
