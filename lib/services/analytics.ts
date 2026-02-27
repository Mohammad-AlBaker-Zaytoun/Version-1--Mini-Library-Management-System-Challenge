import { getAdminDb } from '@/lib/firebase/admin';
import type { AnalyticsOverview, ApiUserContext, Book, CirculationTransaction } from '@/lib/types';

const BOOKS_COLLECTION = 'books';
const TRANSACTIONS_COLLECTION = 'circulationTransactions';

export async function getAnalyticsOverview(user: ApiUserContext): Promise<AnalyticsOverview> {
  const [booksSnapshot, txSnapshot] = await Promise.all([
    getAdminDb().collection(BOOKS_COLLECTION).get(),
    getAdminDb().collection(TRANSACTIONS_COLLECTION).orderBy('createdAt', 'desc').limit(500).get(),
  ]);

  const books = booksSnapshot.docs.map((doc) => doc.data() as Book);
  const transactions = txSnapshot.docs.map((doc) => doc.data() as CirculationTransaction);

  const scopedBooks =
    user.role === 'admin'
      ? books
      : books.filter((book) => book.borrowedByUid === user.uid || book.createdByUid === user.uid);
  const scopedTransactions =
    user.role === 'admin'
      ? transactions
      : transactions.filter((transaction) => transaction.memberUid === user.uid);

  const now = Date.now();

  const activeLoans = scopedBooks.filter((book) => book.availability === 'checked_out').length;
  const overdueCount = scopedBooks.filter((book) => {
    if (book.availability !== 'checked_out' || !book.dueDate) {
      return false;
    }

    return new Date(book.dueDate).getTime() < now;
  }).length;

  const monthlyBuckets = new Map<string, number>();
  for (const entry of scopedTransactions) {
    if (entry.action !== 'checkout') {
      continue;
    }

    const month = entry.createdAt.slice(0, 7);
    monthlyBuckets.set(month, (monthlyBuckets.get(month) ?? 0) + 1);
  }

  const monthlyCheckouts = Array.from(monthlyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return {
    activeLoans,
    overdueCount,
    totalBooks: scopedBooks.length,
    monthlyCheckouts,
  };
}
