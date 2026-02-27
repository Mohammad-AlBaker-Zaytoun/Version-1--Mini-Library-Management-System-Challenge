'use client';

import type { Route } from 'next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { AiCatalogRecommendationCard } from '@/components/books/ai-catalog-recommendation-card';
import { BookGrid } from '@/components/books/book-grid';
import { BookSearchFilters } from '@/components/books/search-filters';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Book, BooksListResponse, CatalogAiRecommendation } from '@/lib/types';

function fromSearchParams(searchParams: URLSearchParams) {
  return {
    q: searchParams.get('q') ?? '',
    author: searchParams.get('author') ?? '',
    genre: searchParams.get('genre') ?? '',
    availability:
      (searchParams.get('availability') as 'all' | 'available' | 'checked_out' | null) ?? 'all',
    page: Number(searchParams.get('page') ?? '1'),
  };
}

export function CatalogClient() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() =>
    fromSearchParams(new URLSearchParams(searchParams.toString())),
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyBookId, setBusyBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<CatalogAiRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const [pendingPageDirection, setPendingPageDirection] = useState<'previous' | 'next' | null>(
    null,
  );
  const hasLoadedOnceRef = useRef(false);
  const booksRequestIdRef = useRef(0);
  const recommendationRequestIdRef = useRef(0);
  const clearHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);
  const isMutating = busyBookId !== null;
  const isActionLocked = isMutating || isRefreshing;
  const areControlsLocked = isActionLocked || isLoading;

  useEffect(() => {
    return () => {
      if (clearHighlightTimerRef.current) {
        clearTimeout(clearHighlightTimerRef.current);
      }
    };
  }, []);

  const loadRecommendation = useCallback(async () => {
    const requestId = ++recommendationRequestIdRef.current;
    setIsRecommendationLoading(true);
    setRecommendationError(null);
    try {
      const response = await authFetch('/api/catalog/ai-recommendation', {
        method: 'POST',
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to load AI recommendation');
      }

      const payload = (await response.json()) as CatalogAiRecommendation;

      if (requestId !== recommendationRequestIdRef.current) {
        return;
      }

      setRecommendation(payload);
    } catch (cause) {
      if (requestId !== recommendationRequestIdRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Failed to load AI recommendation';
      setRecommendationError(message);
    } finally {
      if (requestId === recommendationRequestIdRef.current) {
        setIsRecommendationLoading(false);
      }
    }
  }, []);

  const replaceCatalogUrl = useCallback(
    (params: URLSearchParams) => {
      const nextQueryString = params.toString();
      if (nextQueryString === queryString) {
        return;
      }

      const nextUrl = (nextQueryString ? `${pathname}?${nextQueryString}` : pathname) as Route;
      router.replace(nextUrl);
    },
    [pathname, queryString, router],
  );

  const loadBooks = useCallback(async () => {
    const requestId = ++booksRequestIdRef.current;
    setError(null);
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const parsed = fromSearchParams(new URLSearchParams(queryString));
      const params = new URLSearchParams();
      params.set('page', String(parsed.page || 1));
      params.set('limit', '12');

      if (parsed.q) params.set('q', parsed.q);
      if (parsed.author) params.set('author', parsed.author);
      if (parsed.genre) params.set('genre', parsed.genre);
      if (parsed.availability && parsed.availability !== 'all')
        params.set('availability', parsed.availability);

      const response = await authFetch(`/api/books?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load books');
      }

      const payload = (await response.json()) as BooksListResponse;
      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      setBooks(payload.items);
      setPage(payload.page);
      setTotalPages(payload.totalPages);
      setFilters(parsed);
      hasLoadedOnceRef.current = true;
    } catch (cause) {
      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Failed to load books';
      setError(message);
    } finally {
      if (requestId === booksRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setPendingPageDirection(null);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    void loadRecommendation();
  }, [loadRecommendation, profile?.uid]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentParams = new URLSearchParams(queryString);
      if (filters.q === (currentParams.get('q') ?? '')) {
        return;
      }

      const params = new URLSearchParams(queryString);
      if (filters.q) {
        params.set('q', filters.q);
      } else {
        params.delete('q');
      }
      params.set('page', '1');
      replaceCatalogUrl(params);
    }, 350);

    return () => clearTimeout(timeout);
  }, [filters.q, queryString, replaceCatalogUrl]);

  function applyFilters() {
    if (areControlsLocked) {
      return;
    }

    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.author) params.set('author', filters.author);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.availability !== 'all') params.set('availability', filters.availability);
    params.set('page', '1');

    replaceCatalogUrl(params);
  }

  function focusRecommendation() {
    const recommendedBook = recommendation?.recommendedBook;
    const title = recommendedBook?.title?.trim();
    if (!title) {
      return;
    }

    if (recommendedBook?.id) {
      setHighlightedBookId(recommendedBook.id);
      if (clearHighlightTimerRef.current) {
        clearTimeout(clearHighlightTimerRef.current);
      }

      clearHighlightTimerRef.current = setTimeout(() => {
        setHighlightedBookId((current) => (current === recommendedBook.id ? null : current));
      }, 2400);
    }

    const currentParams = new URLSearchParams(searchParams.toString());
    const alreadyFocused =
      (currentParams.get('q') ?? '') === title &&
      !currentParams.get('author') &&
      !currentParams.get('genre') &&
      !currentParams.get('availability') &&
      (currentParams.get('page') ?? '1') === '1';

    setFilters((current) => ({
      ...current,
      q: title,
      author: '',
      genre: '',
      availability: 'all',
      page: 1,
    }));

    const params = new URLSearchParams();
    params.set('q', title);
    params.set('page', '1');
    replaceCatalogUrl(params);

    if (alreadyFocused) {
      void loadBooks();
    }

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function goToPage(nextPage: number, direction: 'previous' | 'next') {
    if (areControlsLocked) {
      return;
    }

    setPendingPageDirection(direction);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    replaceCatalogUrl(params);
  }

  async function checkout(bookId: string) {
    if (isActionLocked) {
      return;
    }

    setError(null);
    setBusyBookId(bookId);
    try {
      const response = await authFetch('/api/circulation/checkout', {
        method: 'POST',
        body: JSON.stringify({
          bookId,
          loanDays: 14,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Checkout failed');
      }

      await loadBooks();
      await loadRecommendation();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Checkout failed';
      setError(message);
    } finally {
      setBusyBookId(null);
    }
  }

  async function checkin(bookId: string) {
    if (isActionLocked) {
      return;
    }

    setError(null);
    setBusyBookId(bookId);
    try {
      const response = await authFetch('/api/circulation/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Check in failed');
      }

      await loadBooks();
      await loadRecommendation();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Check in failed';
      setError(message);
    } finally {
      setBusyBookId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Book Catalog
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Search by title, author, genre, and availability. Mobile-first circulation actions are
          built in.
        </p>
      </div>

      <BookSearchFilters
        q={filters.q}
        author={filters.author}
        genre={filters.genre}
        availability={filters.availability}
        loading={isLoading || isRefreshing}
        disabled={areControlsLocked}
        onChange={(next) =>
          setFilters((current) => ({
            ...current,
            ...next,
            page: 1,
          }))
        }
        onApply={applyFilters}
      />

      <AiCatalogRecommendationCard
        recommendation={recommendation}
        isLoading={isRecommendationLoading}
        error={recommendationError}
        onRefresh={loadRecommendation}
        onFocusRecommendation={focusRecommendation}
      />

      {error ? (
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader className="mb-0 space-y-2">
            <CardTitle className="text-base text-red-700">Could not complete that request</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadBooks()}
                loading={isLoading || isRefreshing}
                loadingText="Retrying..."
              >
                Retry
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <div ref={resultsRef} className="space-y-2">
        {isLoading ? (
          <CatalogSkeleton />
        ) : (
          <>
            {isRefreshing ? (
              <p className="animate-pulse text-xs text-[var(--text-muted)]">Refreshing catalog...</p>
            ) : null}
            <BookGrid
              books={books}
              currentUserUid={profile?.uid ?? ''}
              role={profile?.role ?? 'member'}
              busyBookId={busyBookId}
              isMutating={areControlsLocked}
              highlightedBookId={highlightedBookId}
              onCheckout={checkout}
              onCheckin={checkin}
            />
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3 text-sm">
        <span className="text-[var(--text-secondary)]">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || areControlsLocked}
            loading={pendingPageDirection === 'previous'}
            loadingText="Loading..."
            onClick={() => goToPage(page - 1, 'previous')}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || areControlsLocked}
            loading={pendingPageDirection === 'next'}
            loadingText="Loading..."
            onClick={() => goToPage(page + 1, 'next')}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={`catalog-skeleton-${index}`} className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      ))}
    </div>
  );
}
