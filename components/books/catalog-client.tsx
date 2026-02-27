'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Route } from 'next';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type {
  Book,
  BookAvailability,
  BooksListResponse,
  UserProfile,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;
const FILTER_DEBOUNCE_MS = 350;

type AvailabilityFilter = '' | BookAvailability;

interface CatalogFilters {
  q: string;
  author: string;
  genre: string;
  tags: string;
  availability: AvailabilityFilter;
}

interface CatalogQueryState extends CatalogFilters {
  page: number;
}

type CirculationAction = 'checkout' | 'checkin' | 'none';

interface BookActionState {
  action: CirculationAction;
  label: string;
  disabled: boolean;
  hint?: string;
}

const EMPTY_FILTERS: CatalogFilters = {
  q: '',
  author: '',
  genre: '',
  tags: '',
  availability: '',
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

  if (state.page > 1) {
    params.set('page', String(state.page));
  }

  return params.toString();
}

function areFiltersEqual(first: CatalogFilters, second: CatalogFilters): boolean {
  return (
    first.q === second.q &&
    first.author === second.author &&
    first.genre === second.genre &&
    first.tags === second.tags &&
    first.availability === second.availability
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

function truncateDescription(value: string | undefined, maxLength: number): string {
  if (!value) {
    return 'No description available yet.';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatDueDate(iso: string | undefined): string | null {
  if (!iso) {
    return null;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function isOverdue(iso: string | undefined): boolean {
  if (!iso) {
    return false;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

function getBookAction(book: Book, profile: UserProfile | null): BookActionState {
  if (!profile) {
    return {
      action: 'none',
      label: 'Unavailable',
      disabled: true,
      hint: 'You need to be signed in to manage circulation',
    };
  }

  if (book.availability === 'available') {
    return {
      action: 'checkout',
      label: 'Check out',
      disabled: false,
      hint: 'Starts a new loan and records a checkout transaction',
    };
  }

  if (profile.role === 'admin') {
    return {
      action: 'checkin',
      label: 'Check in',
      disabled: false,
      hint: 'Admin can process returns for active loans',
    };
  }

  if (book.borrowedByUid === profile.uid) {
    return {
      action: 'checkin',
      label: 'Return',
      disabled: false,
      hint: 'Complete your active loan',
    };
  }

  return {
    action: 'none',
    label: 'Borrowed',
    disabled: true,
    hint: `Currently borrowed by ${book.borrowedByName ?? 'another member'}`,
  };
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

  const hasLoadedOnceRef = useRef(false);
  const requestIdRef = useRef(0);

  const queryString = searchParams.toString();
  const urlState = useMemo(() => parseCatalogQueryState(searchParams), [searchParams]);
  const urlFilters = useMemo<CatalogFilters>(
    () => ({
      q: urlState.q,
      author: urlState.author,
      genre: urlState.genre,
      tags: urlState.tags,
      availability: urlState.availability,
    }),
    [urlState.author, urlState.availability, urlState.genre, urlState.q, urlState.tags],
  );

  const [filters, setFilters] = useState<CatalogFilters>(urlFilters);
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
    urlState.page,
    urlState.q,
    urlState.tags,
  ]);

  function updateFilter<Key extends keyof CatalogFilters>(key: Key, value: CatalogFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

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
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Search className="h-4 w-4 text-[var(--brand-primary)]" />
              Find in catalog
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Filters sync with URL so results can be shared and revisited.
            </p>
          </div>
          <Badge variant="muted">
            {busyBookId
              ? 'Updating loan'
              : isRefreshing
                ? 'Refreshing'
                : `${total} result${total === 1 ? '' : 's'}`}
          </Badge>
        </div>

        <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="catalog-q">Search</Label>
              <Input
                id="catalog-q"
                placeholder="Title, author, genre, tags..."
                value={filters.q}
                onChange={(event) => updateFilter('q', event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="catalog-author">Author</Label>
              <Input
                id="catalog-author"
                placeholder="e.g. Toni Morrison"
                value={filters.author}
                onChange={(event) => updateFilter('author', event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="catalog-genre">Genre</Label>
              <Input
                id="catalog-genre"
                placeholder="e.g. Science Fiction"
                value={filters.genre}
                onChange={(event) => updateFilter('genre', event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="catalog-tags">Tags (comma separated)</Label>
              <Input
                id="catalog-tags"
                placeholder="classic, mystery"
                value={filters.tags}
                onChange={(event) => updateFilter('tags', event.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="catalog-availability">Availability</Label>
              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <select
                  id="catalog-availability"
                  value={filters.availability}
                  onChange={(event) =>
                    updateFilter('availability', event.target.value as AvailabilityFilter)
                  }
                  className="flex h-10 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] pr-3 pl-10 text-sm text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow,background-color] duration-300 ease-[var(--motion-smooth)] hover:border-[#b9c7ff] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none"
                >
                  <option value="">All statuses</option>
                  <option value="available">Available</option>
                  <option value="checked_out">Checked out</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasFilters || Boolean(busyBookId)}
              className="sm:min-w-28"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </div>
        </form>
      </Card>

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => {
              const actionState = getBookAction(book, profile);
              const dueDate = formatDueDate(book.dueDate);
              const overdue = isOverdue(book.dueDate);
              const isBookBusy = busyBookId === book.id;

              return (
                <Card
                  key={book.id}
                  className={cn(
                    'flex h-full transform-gpu flex-col gap-3 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--motion-smooth)] hover:-translate-y-0.5 hover:border-[#c8d4ff]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
                      {book.title}
                    </h3>
                    <Badge variant={book.availability === 'available' ? 'accent' : 'default'}>
                      {book.availability === 'available' ? 'Available' : 'Checked out'}
                    </Badge>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)]">by {book.author}</p>

                  <div className="flex flex-wrap gap-1">
                    {book.genre ? <Badge variant="muted">{book.genre}</Badge> : null}
                    {typeof book.publishedYear === 'number' ? (
                      <Badge variant="muted">{book.publishedYear}</Badge>
                    ) : null}
                  </div>

                  {book.availability === 'checked_out' ? (
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-2">
                      <p className="text-xs text-[var(--text-secondary)]">
                        Borrower: <span className="font-semibold">{book.borrowedByName ?? 'Unknown'}</span>
                      </p>
                      <p
                        className={cn(
                          'text-xs',
                          overdue ? 'font-semibold text-[#c43f32]' : 'text-[var(--text-secondary)]',
                        )}
                      >
                        {dueDate ? `Due ${dueDate}${overdue ? ' (Overdue)' : ''}` : 'Due date unavailable'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Ready to borrow with a default 14-day due window.
                    </p>
                  )}

                  <p className="text-xs leading-5 text-[var(--text-muted)]">
                    {truncateDescription(book.description ?? book.aiSummary, 140)}
                  </p>

                  {book.tags.length > 0 ? (
                    <div className="mt-auto flex flex-wrap gap-1">
                      {book.tags.slice(0, 4).map((tag) => (
                        <Badge key={`${book.id}-${tag}`} variant="muted" className="text-[11px]">
                          #{tag}
                        </Badge>
                      ))}
                      {book.tags.length > 4 ? (
                        <Badge variant="muted" className="text-[11px]">
                          +{book.tags.length - 4}
                        </Badge>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <Button
                      variant={actionState.action === 'checkin' ? 'secondary' : 'primary'}
                      disabled={actionState.disabled || Boolean(busyBookId)}
                      loading={isBookBusy}
                      loadingText={actionState.action === 'checkin' ? 'Checking in...' : 'Checking out...'}
                      onClick={() => {
                        if (actionState.action !== 'none') {
                          void handleCirculation(book, actionState.action);
                        }
                      }}
                    >
                      {actionState.label}
                    </Button>
                    {actionState.hint ? (
                      <p className="text-[11px] text-[var(--text-muted)]">{actionState.hint}</p>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>

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

function CatalogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={`catalog-loading-${index}`} className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
