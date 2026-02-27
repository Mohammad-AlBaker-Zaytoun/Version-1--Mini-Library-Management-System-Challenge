import { getAdminDb } from '@/lib/firebase/admin';
import type { AnalyticsOverviewQueryInput } from '@/lib/schemas/analytics';
import type { AnalyticsOverview, ApiUserContext, Book, CirculationTransaction } from '@/lib/types';

const BOOKS_COLLECTION = 'books';
const TRANSACTIONS_COLLECTION = 'circulationTransactions';

interface MonthBucket {
  key: string;
  label: string;
}

function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function createMonthBuckets(rangeMonths: number, now: Date): MonthBucket[] {
  return Array.from({ length: rangeMonths }, (_, index) => {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (rangeMonths - 1 - index), 1));
    return {
      key: toMonthKey(monthDate),
      label: new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: '2-digit',
      }).format(monthDate),
    };
  });
}

function isBookOverdue(book: Book, nowMs: number): boolean {
  if (book.availability !== 'checked_out' || !book.dueDate) {
    return false;
  }

  const dueMs = new Date(book.dueDate).getTime();
  if (Number.isNaN(dueMs)) {
    return false;
  }

  return dueMs < nowMs;
}

function computeSeries(
  transactions: CirculationTransaction[],
  buckets: MonthBucket[],
): Pick<AnalyticsOverview, 'monthlyCheckouts' | 'monthlyCheckins'> {
  const checkoutMap = new Map<string, number>(buckets.map((bucket) => [bucket.key, 0]));
  const checkinMap = new Map<string, number>(buckets.map((bucket) => [bucket.key, 0]));

  for (const transaction of transactions) {
    const createdAt = new Date(transaction.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      continue;
    }

    const key = toMonthKey(createdAt);
    if (!checkoutMap.has(key)) {
      continue;
    }

    if (transaction.action === 'checkout') {
      checkoutMap.set(key, (checkoutMap.get(key) ?? 0) + 1);
      continue;
    }

    checkinMap.set(key, (checkinMap.get(key) ?? 0) + 1);
  }

  return {
    monthlyCheckouts: buckets.map((bucket) => ({
      month: bucket.label,
      count: checkoutMap.get(bucket.key) ?? 0,
    })),
    monthlyCheckins: buckets.map((bucket) => ({
      month: bucket.label,
      count: checkinMap.get(bucket.key) ?? 0,
    })),
  };
}

function roundPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getAnalyticsOverview(
  actor: ApiUserContext,
  query: AnalyticsOverviewQueryInput,
): Promise<AnalyticsOverview> {
  const db = getAdminDb();
  const now = new Date();
  const nowMs = now.getTime();
  const buckets = createMonthBuckets(query.rangeMonths, now);

  const booksSnapshot = await db.collection(BOOKS_COLLECTION).limit(2500).get();
  const books = booksSnapshot.docs.map((document) => document.data() as Book);

  const totalBooks = books.length;
  const activeLoansGlobal = books.filter((book) => book.availability === 'checked_out').length;
  const availableBooks = books.filter((book) => book.availability === 'available').length;
  const overdueGlobal = books.filter((book) => isBookOverdue(book, nowMs)).length;

  const myActiveLoans = books.filter(
    (book) => book.availability === 'checked_out' && book.borrowedByUid === actor.uid,
  ).length;
  const myOverdueLoans = books.filter(
    (book) => book.borrowedByUid === actor.uid && isBookOverdue(book, nowMs),
  ).length;

  const transactionsSnapshot =
    actor.role === 'admin'
      ? await db.collection(TRANSACTIONS_COLLECTION).orderBy('createdAt', 'desc').limit(5000).get()
      : await db.collection(TRANSACTIONS_COLLECTION).where('memberUid', '==', actor.uid).limit(5000).get();

  const transactions = transactionsSnapshot.docs
    .map((document) => document.data() as CirculationTransaction)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  const { monthlyCheckouts, monthlyCheckins } = computeSeries(transactions, buckets);

  const scope: AnalyticsOverview['scope'] = actor.role === 'admin' ? 'admin' : 'member';
  const scopedActiveLoans = scope === 'admin' ? activeLoansGlobal : myActiveLoans;
  const scopedOverdue = scope === 'admin' ? overdueGlobal : myOverdueLoans;
  const utilizationBase = scope === 'admin' ? activeLoansGlobal : myActiveLoans;
  const utilizationRate = totalBooks > 0 ? roundPercent((utilizationBase / totalBooks) * 100) : 0;

  return {
    scope,
    totalBooks,
    availableBooks,
    activeLoans: scopedActiveLoans,
    overdueCount: scopedOverdue,
    myActiveLoans,
    myOverdueLoans,
    utilizationRate,
    monthlyCheckouts,
    monthlyCheckins,
  };
}
