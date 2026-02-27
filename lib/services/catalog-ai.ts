import { getAdminDb } from '@/lib/firebase/admin';
import { generateCatalogSuggestion } from '@/lib/services/ai';
import type { ApiUserContext, Book, CatalogAiRecommendation, CirculationTransaction } from '@/lib/types';

const BOOKS_COLLECTION = 'books';
const TRANSACTIONS_COLLECTION = 'circulationTransactions';

function sortByCreatedAtDesc(entries: CirculationTransaction[]): CirculationTransaction[] {
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function topKeys(counter: Map<string, number>, limit: number): string[] {
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function buildFallbackReason(book: Book, favoriteGenres: string[], favoriteTags: string[]): string {
  const reasons: string[] = [];
  if (book.genre && favoriteGenres.some((genre) => normalizeToken(genre) === normalizeToken(book.genre ?? ''))) {
    reasons.push(`its ${book.genre} genre matches your recent borrowing pattern`);
  }

  const favoriteTagSet = new Set(favoriteTags.map(normalizeToken));
  const overlap = book.tags.filter((tag) => favoriteTagSet.has(normalizeToken(tag)));
  if (overlap.length > 0) {
    reasons.push(`it shares themes you often borrow (${overlap.slice(0, 2).join(', ')})`);
  }

  if (reasons.length === 0) {
    reasons.push('it is currently available and aligned with your reading activity');
  }

  return `Suggested next checkout: "${book.title}" by ${book.author}, because ${reasons.join(' and ')}.`;
}

async function getUserTransactionsWithFallback(userUid: string): Promise<CirculationTransaction[]> {
  const collection = getAdminDb().collection(TRANSACTIONS_COLLECTION);

  try {
    const snapshot = await collection
      .where('memberUid', '==', userUid)
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    return snapshot.docs.map((doc) => doc.data() as CirculationTransaction);
  } catch {
    const snapshot = await collection.where('memberUid', '==', userUid).limit(1000).get();
    return snapshot.docs.map((doc) => doc.data() as CirculationTransaction);
  }
}

export async function getCatalogRecommendationForUser(
  user: ApiUserContext,
): Promise<CatalogAiRecommendation> {
  const [transactions, booksSnapshot] = await Promise.all([
    getUserTransactionsWithFallback(user.uid),
    getAdminDb().collection(BOOKS_COLLECTION).orderBy('updatedAt', 'desc').limit(500).get(),
  ]);

  const sortedTransactions = sortByCreatedAtDesc(transactions).slice(0, 300);
  const books = booksSnapshot.docs.map((doc) => doc.data() as Book);

  const checkoutEntries = sortedTransactions.filter((entry) => entry.action === 'checkout');
  const checkinEntries = sortedTransactions.filter((entry) => entry.action === 'checkin');

  const booksById = new Map(books.map((book) => [book.id, book]));
  const borrowedBookIds = [...new Set(checkoutEntries.map((entry) => entry.bookId))];
  const borrowedBooks = borrowedBookIds
    .map((bookId) => booksById.get(bookId))
    .filter((book): book is Book => Boolean(book));

  const genreCounter = new Map<string, number>();
  const authorCounter = new Map<string, number>();
  const tagCounter = new Map<string, number>();

  for (const book of borrowedBooks) {
    if (book.genre) {
      genreCounter.set(book.genre, (genreCounter.get(book.genre) ?? 0) + 1);
    }

    authorCounter.set(book.author, (authorCounter.get(book.author) ?? 0) + 1);

    for (const tag of book.tags) {
      tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1);
    }
  }

  const favoriteGenres = topKeys(genreCounter, 3);
  const favoriteAuthors = topKeys(authorCounter, 3);
  const favoriteTags = topKeys(tagCounter, 5);

  const borrowedBookIdSet = new Set(borrowedBookIds);
  const favoriteGenreSet = new Set(favoriteGenres.map(normalizeToken));
  const favoriteAuthorSet = new Set(favoriteAuthors.map(normalizeToken));
  const favoriteTagSet = new Set(favoriteTags.map(normalizeToken));

  const availableBooks = books.filter((book) => book.availability === 'available');
  if (availableBooks.length === 0) {
    return {
      recommendedBook: null,
      reason: 'No books are currently available to recommend for checkout right now.',
      whyItFits: [
        'All books are currently checked out or unavailable.',
        'Try again after a check-in event to get a personalized next-book suggestion.',
      ],
      basedOn: {
        checkoutCount: checkoutEntries.length,
        checkinCount: checkinEntries.length,
        favoriteGenres,
        favoriteTags,
      },
    };
  }

  const rankedCandidates = availableBooks
    .map((book) => {
      const genreScore = book.genre && favoriteGenreSet.has(normalizeToken(book.genre)) ? 5 : 0;
      const authorScore = favoriteAuthorSet.has(normalizeToken(book.author)) ? 3 : 0;
      const tagScore = book.tags.reduce(
        (score, tag) => score + (favoriteTagSet.has(normalizeToken(tag)) ? 1 : 0),
        0,
      );
      const historyPenalty = borrowedBookIdSet.has(book.id) ? -4 : 0;
      const totalScore = genreScore + authorScore + tagScore + historyPenalty;

      return {
        book,
        totalScore,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.book.title.localeCompare(b.book.title));

  const shortlistedCandidates = rankedCandidates.slice(0, 12).map((entry) => entry.book);
  const fallbackBook = shortlistedCandidates[0] ?? availableBooks[0] ?? null;

  if (!fallbackBook) {
    return {
      recommendedBook: null,
      reason: 'No books are currently available in your catalog scope to recommend.',
      whyItFits: [
        'All current items may be unavailable or filtered out of your access scope.',
        'Try again after a check-in event adds available inventory.',
      ],
      basedOn: {
        checkoutCount: checkoutEntries.length,
        checkinCount: checkinEntries.length,
        favoriteGenres,
        favoriteTags,
      },
    };
  }

  const aiSuggestion = await generateCatalogSuggestion({
    userDisplayName: user.displayName || user.email || 'Member',
    checkoutCount: checkoutEntries.length,
    checkinCount: checkinEntries.length,
    favoriteGenres,
    favoriteAuthors,
    favoriteTags,
    recentTitles: checkoutEntries.slice(0, 6).map((entry) => entry.bookTitle),
    candidateBooks: shortlistedCandidates.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre ?? '',
      tags: book.tags,
      description: (book.description ?? '').slice(0, 600),
    })),
  });

  const chosenBook =
    shortlistedCandidates.find((candidate) => candidate.id === aiSuggestion.recommendedBookId) ??
    fallbackBook;

  const fallbackWhy = [
    `You have ${checkoutEntries.length} prior checkouts that shaped this suggestion.`,
    chosenBook.genre
      ? `Its ${chosenBook.genre} profile overlaps with your borrowing preferences.`
      : 'Its topic profile aligns with your recent circulation history.',
    'It is available now, so you can check it out immediately.',
  ];

  return {
    recommendedBook: {
      id: chosenBook.id,
      title: chosenBook.title,
      author: chosenBook.author,
      genre: chosenBook.genre,
      coverUrl: chosenBook.coverUrl,
      tags: chosenBook.tags,
      availability: chosenBook.availability,
    },
    reason: aiSuggestion.reason || buildFallbackReason(chosenBook, favoriteGenres, favoriteTags),
    whyItFits: aiSuggestion.whyItFits.length > 0 ? aiSuggestion.whyItFits : fallbackWhy,
    basedOn: {
      checkoutCount: checkoutEntries.length,
      checkinCount: checkinEntries.length,
      favoriteGenres,
      favoriteTags,
    },
  };
}
