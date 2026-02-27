'use client';

import { ArrowRightLeft, RefreshCcw } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { CirculationHistoryResponse, CirculationTransaction } from '@/lib/types';
import { cn } from '@/lib/utils';

type ActionFilter = '' | 'checkout' | 'checkin';

const PAGE_SIZE = 20;

function parsePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function parseActionFilter(value: string | null): ActionFilter {
  if (value === 'checkout' || value === 'checkin') {
    return value;
  }

  return '';
}

function toQueryString(input: { action: ActionFilter; page: number }): string {
  const params = new URLSearchParams();
  if (input.action) {
    params.set('action', input.action);
  }

  if (input.page > 1) {
    params.set('page', String(input.page));
  }

  return params.toString();
}

function formatTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
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

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function HistoryClient() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<CirculationHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasLoadedOnceRef = useRef(false);
  const requestIdRef = useRef(0);

  const queryString = searchParams.toString();
  const action = parseActionFilter(searchParams.get('action'));
  const page = parsePage(searchParams.get('page'));

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setError(null);

    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const requestParams = new URLSearchParams(queryString);
    requestParams.set('limit', String(PAGE_SIZE));
    requestParams.set('page', String(page));

    void (async () => {
      try {
        const response = await authFetch(`/api/circulation/history?${requestParams.toString()}`);
        if (!response.ok) {
          throw new Error(await readApiError(response, 'Unable to load circulation history'));
        }

        const payload = (await response.json()) as CirculationHistoryResponse;
        if (requestId !== requestIdRef.current) {
          return;
        }

        setData(payload);
        hasLoadedOnceRef.current = true;

        if (payload.page !== page) {
          const correctedQuery = toQueryString({
            action,
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

        setError(cause instanceof Error ? cause.message : 'Unable to load circulation history');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();
  }, [action, page, pathname, queryString, refreshTick, router]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const checkoutCount = items.filter((entry) => entry.action === 'checkout').length;
  const checkinCount = items.filter((entry) => entry.action === 'checkin').length;

  function setFilterAction(nextAction: ActionFilter) {
    const nextQuery = toQueryString({
      action: nextAction,
      page: 1,
    });
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;
    if (nextHref !== currentHref) {
      router.replace(nextHref as Route, { scroll: false });
    }
  }

  function goToPage(nextPage: number) {
    const safePage = Math.max(nextPage, 1);
    const nextQuery = toQueryString({
      action,
      page: safePage,
    });
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    const currentHref = queryString ? `${pathname}?${queryString}` : pathname;
    if (nextHref !== currentHref) {
      router.replace(nextHref as Route, { scroll: false });
    }
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <ArrowRightLeft className="h-4 w-4 text-[var(--brand-primary)]" />
              Circulation timeline
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {profile?.role === 'admin'
                ? 'Showing all circulation events with optional action filters.'
                : 'Showing your personal checkouts and checkins.'}
            </p>
          </div>
          <Badge variant="muted">
            {isRefreshing ? 'Refreshing' : `${total} event${total === 1 ? '' : 's'}`}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Card className="space-y-1 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Checkouts</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{checkoutCount}</p>
          </Card>
          <Card className="space-y-1 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Checkins</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{checkinCount}</p>
          </Card>
          <Card className="space-y-1 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Page</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {data?.page ?? page}/{totalPages}
            </p>
          </Card>
          <Card className="space-y-1 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">Total events</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{total}</p>
          </Card>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label htmlFor="history-action-filter" className="text-xs font-medium text-[var(--text-secondary)]">
              Action
            </label>
            <select
              id="history-action-filter"
              className="flex h-10 w-full min-w-44 appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow,background-color] duration-300 ease-[var(--motion-smooth)] hover:border-[#b9c7ff] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none"
              value={action}
              onChange={(event) => setFilterAction(event.target.value as ActionFilter)}
            >
              <option value="">All actions</option>
              <option value="checkout">Checkout</option>
              <option value="checkin">Checkin</option>
            </select>
          </div>

          <Button variant="outline" size="sm" onClick={() => setRefreshTick((current) => current + 1)}>
            <RefreshCcw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="space-y-3 border-red-200 bg-red-50/80">
          <p className="text-sm font-semibold text-red-700">Unable to load history</p>
          <p className="text-xs text-red-600">{error}</p>
          <div>
            <Button size="sm" variant="outline" onClick={() => setRefreshTick((current) => current + 1)}>
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <HistorySkeleton />
      ) : items.length === 0 ? (
        <Card className="space-y-2 border-dashed">
          <p className="text-sm font-semibold text-[var(--text-primary)]">No transactions found</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Activity appears here after books are checked out or checked in.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} showMember={profile?.role === 'admin'} />
            ))}
          </div>

          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              Page {data?.page ?? page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(data?.page ?? page) <= 1}
                onClick={() => goToPage((data?.page ?? page) - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(data?.page ?? page) >= totalPages}
                onClick={() => goToPage((data?.page ?? page) + 1)}
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

function HistoryItem({
  entry,
  showMember,
}: {
  entry: CirculationTransaction;
  showMember: boolean;
}) {
  const dueDate = formatDueDate(entry.dueDate);
  const isCheckout = entry.action === 'checkout';

  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.bookTitle}</p>
        <Badge variant={isCheckout ? 'default' : 'accent'}>
          {isCheckout ? 'Checkout' : 'Checkin'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-1 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
        {showMember ? (
          <p>
            Member: <span className="font-medium text-[var(--text-primary)]">{entry.memberName}</span>
          </p>
        ) : null}
        <p>
          Actor: <span className="font-medium text-[var(--text-primary)]">{entry.actorName}</span>
        </p>
        <p>
          Time:{' '}
          <span className="font-medium text-[var(--text-primary)]">{formatTimestamp(entry.createdAt)}</span>
        </p>
        <p
          className={cn(
            isCheckout && dueDate ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]',
          )}
        >
          {isCheckout && dueDate ? `Due: ${dueDate}` : 'Due: n/a'}
        </p>
      </div>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={`history-skeleton-${index}`} className="space-y-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
