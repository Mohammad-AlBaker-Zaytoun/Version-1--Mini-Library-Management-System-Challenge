import { addDaysIso, nowIso } from '@/lib/utils';
import { getAdminDb } from '@/lib/firebase/admin';
import { badRequest, notFound } from '@/lib/api/errors';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiUserContext, Book, CirculationTransaction, Role, UserProfile } from '@/lib/types';

const BOOKS_COLLECTION = 'books';
const USERS_COLLECTION = 'users';
const TRANSACTIONS_COLLECTION = 'circulationTransactions';

function getActorName(user: ApiUserContext): string {
  return user.displayName || user.email || 'Unknown user';
}

function canActOnLoan(targetMemberUid: string, role: Role, actorUid: string): boolean {
  return role === 'admin' || actorUid === targetMemberUid;
}

export async function checkoutBook(params: {
  bookId: string;
  memberUid: string;
  loanDays: number;
  actor: ApiUserContext;
}): Promise<{ book: Book; transaction: CirculationTransaction }> {
  const now = nowIso();
  const dueDate = addDaysIso(now, params.loanDays);
  const actorName = getActorName(params.actor);

  if (!canActOnLoan(params.memberUid, params.actor.role, params.actor.uid)) {
    badRequest('Members can only checkout books for themselves');
  }

  const bookRef = getAdminDb().collection(BOOKS_COLLECTION).doc(params.bookId);
  const memberRef = getAdminDb().collection(USERS_COLLECTION).doc(params.memberUid);
  const txRef = getAdminDb().collection(TRANSACTIONS_COLLECTION).doc();

  return getAdminDb().runTransaction(async (transaction) => {
    const [bookSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(bookRef),
      transaction.get(memberRef),
    ]);

    if (!bookSnapshot.exists) {
      notFound('Book not found');
    }

    if (!memberSnapshot.exists) {
      notFound('Member profile not found');
    }

    const book = bookSnapshot.data() as Book;
    const member = memberSnapshot.data() as UserProfile;

    if (book.availability === 'checked_out') {
      badRequest('Book is already checked out');
    }

    const updatedBook: Book = {
      ...book,
      availability: 'checked_out',
      borrowedByUid: member.uid,
      borrowedByName: member.displayName,
      borrowedAt: now,
      dueDate,
      updatedAt: now,
      updatedByUid: params.actor.uid,
    };

    const ledgerEntry: CirculationTransaction = {
      id: txRef.id,
      bookId: book.id,
      bookTitle: book.title,
      action: 'checkout',
      memberUid: member.uid,
      memberName: member.displayName,
      actorUid: params.actor.uid,
      actorName,
      dueDate,
      createdAt: now,
    };

    transaction.set(bookRef, updatedBook, { merge: true });
    transaction.set(txRef, ledgerEntry);

    return {
      book: updatedBook,
      transaction: ledgerEntry,
    };
  });
}

export async function checkinBook(params: {
  bookId: string;
  actor: ApiUserContext;
}): Promise<{ book: Book; transaction: CirculationTransaction }> {
  const now = nowIso();
  const actorName = getActorName(params.actor);
  const bookRef = getAdminDb().collection(BOOKS_COLLECTION).doc(params.bookId);
  const txRef = getAdminDb().collection(TRANSACTIONS_COLLECTION).doc();

  return getAdminDb().runTransaction(async (transaction) => {
    const bookSnapshot = await transaction.get(bookRef);

    if (!bookSnapshot.exists) {
      notFound('Book not found');
    }

    const book = bookSnapshot.data() as Book;

    if (book.availability !== 'checked_out' || !book.borrowedByUid || !book.borrowedByName) {
      badRequest('Book is not currently checked out');
    }

    if (!canActOnLoan(book.borrowedByUid, params.actor.role, params.actor.uid)) {
      badRequest('Members can only check in their own loans');
    }

    const ledgerEntry: CirculationTransaction = {
      id: txRef.id,
      bookId: book.id,
      bookTitle: book.title,
      action: 'checkin',
      memberUid: book.borrowedByUid,
      memberName: book.borrowedByName,
      actorUid: params.actor.uid,
      actorName,
      createdAt: now,
    };

    transaction.update(bookRef, {
      availability: 'available',
      borrowedByUid: FieldValue.delete(),
      borrowedByName: FieldValue.delete(),
      borrowedAt: FieldValue.delete(),
      dueDate: FieldValue.delete(),
      updatedAt: now,
      updatedByUid: params.actor.uid,
    });
    transaction.set(txRef, ledgerEntry);

    const updatedBook: Book = {
      ...book,
      availability: 'available',
      updatedAt: now,
      updatedByUid: params.actor.uid,
    };

    delete updatedBook.borrowedByUid;
    delete updatedBook.borrowedByName;
    delete updatedBook.borrowedAt;
    delete updatedBook.dueDate;

    return {
      book: updatedBook,
      transaction: ledgerEntry,
    };
  });
}

export async function listTransactions(params: {
  user: ApiUserContext;
  limit?: number;
}): Promise<CirculationTransaction[]> {
  const snapshot = await getAdminDb()
    .collection(TRANSACTIONS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(params.limit ?? 200)
    .get();

  const allEntries = snapshot.docs.map((doc) => doc.data() as CirculationTransaction);

  if (params.user.role === 'admin') {
    return allEntries;
  }

  return allEntries.filter((entry) => entry.memberUid === params.user.uid);
}
