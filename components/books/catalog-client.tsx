'use client';

import type { Route } from 'next';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AiCatalogRecommendationCard } from '@/components/books/ai-catalog-recommendation-card';
import { CatalogBookGrid, CatalogGridSkeleton } from '@/components/books/book-grid';
import {
  CatalogSearchFilters,
  type AvailabilityFilter,
  type CatalogFilterValues,
} from '@/components/books/search-filters';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authFetch } from '@/lib/auth/client';
import type { Book, BooksListResponse, CatalogAiRecommendation } from '@/lib/types';

const PAGE_SIZE = 12;
const FILTER_DEBOUNCE_MS = 350;

interface CatalogQueryState extends CatalogFilterValues {
  page: number;
}

const EMPTY_FILTERS: CatalogFilterValues = {
  q: '',
  author: '',
  genre: '',
  tags: '',
  availability: '',
  overdueOnly: false,
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function parsePage(value: string | null): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function normalizeTagsInput(value: string): string {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ');
}

function parseCatalogQueryState(searchParams: ReadonlyURLSearchParams): CatalogQueryState {
  const availability = searchParams.get('availability');
  const safeAvailability: AvailabilityFilter =
    availability === 'available' || availability === 'checked_out' ? availability : '';

  return {
    q: searchParams.get('q') ?? '',
    author: searchParams.get('author') ?? '',
    genre: searchParams.get('genre') ?? '',
    tags: normalizeTagsInput(searchParams.get('tags') ?? ''),
    availability: safeAvailability,
    overdueOnly: searchParams.get('overdue') === 'true',
    page: parsePage(searchParams.get('page')),
  };
}

function createQueryString(state: CatalogQueryState): string {
  const params = new URLSearchParams();

  if (state.q.trim()) {
    params.set('q', state.q.trim());
  }

  if (state.author.trim()) {
    params.set('author', state.author.trim());
  }

  if (state.genre.trim()) {
    params.set('genre', state.genre.trim());
  }

  const tags = normalizeTagsInput(state.tags);
  if (tags) {
    params.set('tags', tags.replace(/,\s*/g, ','));
  }

  if (state.availability) {
    params.set('availability', state.availability);
  }

  if (state.overdueOnly) {
    params.set('overdue', 'true');
  }

  if (state.page > 1) {
    params.set('page', String(state.page));
  }

  return params.toString();
}

function areFiltersEqual(first: CatalogFilterValues, second: CatalogFilterValues): boolean {
  return (
    first.q === second.q &&
    first.author === second.author &&
    first.genre === second.genre &&
    first.tags === second.tags &&
    first.availability === second.availability &&
    first.overdueOnly === second.overdueOnly
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

export function CatalogClient() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<BooksListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyBookId, setBusyBookId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [recommendation, setRecommendation] = useState<CatalogAiRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);

  const hasLoadedOnceRef = useRef(false);
  const requestIdRef = useRef(0);
  const recommendationRequestIdRef = useRef(0);
  const hasRequestedRecommendationRef = useRef<string | null>(null);

  const queryString = searchParams.toString();
  const urlState = useMemo(() => parseCatalogQueryState(searchParams), [searchParams]);
  const urlFilters = useMemo<CatalogFilterValues>(
    () => ({
      q: urlState.q,
      author: urlState.author,
      genre: urlState.genre,
      tags: urlState.tags,
      availability: urlState.availability,
      overdueOnly: urlState.overdueOnly,
    }),
    [
      urlState.author,
      urlState.availability,
      urlState.genre,
      urlState.overdueOnly,
      urlState.q,
      urlState.tags,
    ],
  );

  const [filters, setFilters] = useState<CatalogFilterValues>(urlFilters);
  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setFilters((current) => (areFiltersEqual(current, urlFilters) ? current : urlFilters));
  }, [urlFilters]);

  useEffect(() => {
    if (areFiltersEqual(debouncedFilters, urlFilters)) {
      return;
    }

    const nextQuery = createQueryString({
      ...debouncedFilters,
      page: 1,
    });
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref as Route, { scroll: false });
    }
  }, [debouncedFilters, pathname, queryString, router, urlFilters]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setError(null);

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const requestParams = new URLSearchParams(queryString);
    requestParams.set('page', String(urlState.page));
    requestParams.set('limit', String(PAGE_SIZE));

    void (async () => {
      try {
        const response = await authFetch(`/api/books?${requestParams.toString()}`);
        if (!response.ok) {
          throw new Error('Unable to load catalog data');
        }

        const payload = (await response.json()) as BooksListResponse;
        if (requestId !== requestIdRef.current) {
          return;
        }

        setResults(payload);
        hasLoadedOnceRef.current = true;

        if (payload.page !== urlState.page) {
          const correctedQuery = createQueryString({
            q: urlState.q,
            author: urlState.author,
            genre: urlState.genre,
            tags: urlState.tags,
            availability: urlState.availability,
            overdueOnly: urlState.overdueOnly,
            page: payload.page,
          });
          const correctedHref = correctedQuery ? `${pathname}?${correctedQuery}` : pathname;
          const currentHref = queryString ? `${pathname}?${queryString}` : pathname;
          if (correctedHref !== currentHref) {
            router.replace(correctedHref as Route, { scroll: false });
          }
        }
      } catch (cause) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        const message = cause instanceof Error ? cause.message : 'Unable to load catalog data';
        setError(message);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();
  }, [
    pathname,
    queryString,
    refreshTick,
    router,
    urlState.author,
    urlState.availability,
    urlState.genre,
    urlState.overdueOnly,
    urlState.page,
    urlState.q,
    urlState.tags,
  ]);

  const fetchRecommendation = useCallback(async (): Promise<void> => {
    if (!profile?.uid) {
      setRecommendation(null);
      setRecommendationError(null);
      return;
    }

    const requestId = ++recommendationRequestIdRef.current;
    setIsRecommendationLoading(true);
    setRecommendationError(null);

    try {
      const response = await authFetch('/api/catalog/ai-recommendation', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to load AI recommendation'));
      }

      const payload = (await response.json()) as CatalogAiRecommendation;
      if (requestId !== recommendationRequestIdRef.current) {
        return;
      }

      setRecommendation(payload);
      hasRequestedRecommendationRef.current = profile.uid;
    } catch (cause) {
      if (requestId !== recommendationRequestIdRef.current) {
        return;
      }

      setRecommendationError(getErrorMessage(cause, 'Unable to load AI recommendation'));
    } finally {
      if (requestId === recommendationRequestIdRef.current) {
        setIsRecommendationLoading(false);
      }
    }
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) {
      hasRequestedRecommendationRef.current = null;
      setRecommendation(null);
      setRecommendationError(null);
      setIsRecommendationLoading(false);
      return;
    }

    if (hasRequestedRecommendationRef.current === profile.uid) {
      return;
    }

    void fetchRecommendation();
  }, [fetchRecommendation, profile?.uid]);

  function goToPage(page: number) {
    const safePage = Math.max(page, 1);
    const nextQuery = createQueryString({
      ...urlState,
      page: safePage,
    });
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref as Route, { scroll: false });
    }
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    router.replace(pathname as Route, { scroll: false });
  }

  function focusRecommendationInCatalog() {
    const suggested = recommendation?.recommendedBook;
    if (!suggested) {
      return;
    }

    const nextFilters: CatalogFilterValues = {
      q: suggested.title,
      author: suggested.author,
      genre: '',
      tags: '',
      availability: '',
      overdueOnly: false,
    };

    setFilters(nextFilters);
    const nextQuery = createQueryString({
      ...nextFilters,
      page: 1,
    });
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;

    if (nextHref !== currentHref) {
      router.replace(nextHref as Route, { scroll: false });
    }
  }

  async function handleCirculation(book: Book, action: 'checkout' | 'checkin') {
    if (busyBookId) {
      return;
    }

    setMutationError(null);
    setBusyBookId(book.id);
    try {
      const endpoint =
        action === 'checkout' ? '/api/circulation/checkout' : '/api/circulation/checkin';
      const payload =
        action === 'checkout'
          ? {
              bookId: book.id,
              dueDays: 14,
            }
          : {
              bookId: book.id,
            };

      const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, `Unable to ${action} book`));
      }

      await response.json();
      setRefreshTick((current) => current + 1);
      await fetchRecommendation();
    } catch (cause) {
      setMutationError(getErrorMessage(cause, `Unable to ${action} book`));
    } finally {
      setBusyBookId(null);
    }
  }

  const page = results?.page ?? urlState.page;
  const totalPages = results?.totalPages ?? 1;
  const total = results?.total ?? 0;
  const books = results?.items ?? [];
  const hasFilters = queryString.length > 0;

  return (
    <section className="space-y-4">
      <CatalogSearchFilters
        filters={filters}
        total={total}
        hasFilters={hasFilters}
        busyBookId={busyBookId}
        isRefreshing={isRefreshing}
        onUpdate={(next) => setFilters((current) => ({ ...current, ...next }))}
        onReset={resetFilters}
      />

      <AiCatalogRecommendationCard
        recommendation={recommendation}
        isLoading={isRecommendationLoading}
        error={recommendationError}
        onRefresh={fetchRecommendation}
        onFocusRecommendation={focusRecommendationInCatalog}
      />

      {error ? (
        <Card className="space-y-3 border-red-200 bg-red-50/80">
          <p className="text-sm font-semibold text-red-700">Catalog request failed</p>
          <p className="text-xs text-red-600">{error}</p>
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshTick((current) => current + 1)}
            >
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {mutationError ? (
        <Card className="space-y-2 border-amber-200 bg-amber-50/80">
          <p className="text-sm font-semibold text-amber-700">Circulation action failed</p>
          <p className="text-xs text-amber-700/90">{mutationError}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <CatalogGridSkeleton />
      ) : books.length === 0 ? (
        <Card className="space-y-3 border-dashed">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No books found</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Try widening search terms or clearing filters.
          </p>
          {hasFilters ? (
            <div>
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          ) : null}
        </Card>
      ) : (
        <>
          <CatalogBookGrid
            books={books}
            profile={profile}
            busyBookId={busyBookId}
            onCirculation={(book, action) => {
              void handleCirculation(book, action);
            }}
          />

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || Boolean(busyBookId)}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || Boolean(busyBookId)}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
