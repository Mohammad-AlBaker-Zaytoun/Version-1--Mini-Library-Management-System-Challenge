'use client';

import { RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AiOverviewPanel } from '@/components/dashboard/ai-overview-panel';
import { AnalyticsCards } from '@/components/dashboard/analytics-cards';
import { CirculationBreakdownChart } from '@/components/dashboard/circulation-breakdown-chart';
import { MonthlyCheckoutChart } from '@/components/dashboard/monthly-checkout-chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { AnalyticsOverview } from '@/lib/types';

type RangeOption = 3 | 6 | 12;

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function AnalyticsClient() {
  const [range, setRange] = useState<RangeOption>(6);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setError(null);

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    void (async () => {
      try {
        const response = await authFetch(`/api/analytics/overview?range=${range}`);
        if (!response.ok) {
          throw new Error(await readApiError(response, 'Unable to load dashboard metrics'));
        }

        const payload = (await response.json()) as AnalyticsOverview;
        if (requestId !== requestIdRef.current) {
          return;
        }

        setOverview(payload);
        hasLoadedRef.current = true;
      } catch (cause) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Unable to load dashboard metrics');
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();
  }, [range, refreshTick]);

  const scope = overview?.scope ?? 'admin';
  const totalBooks = overview?.totalBooks ?? 0;
  const availableBooks = overview?.availableBooks ?? 0;
  const activeLoans = overview?.activeLoans ?? 0;
  const overdueCount = overview?.overdueCount ?? 0;
  const utilizationRate = overview?.utilizationRate ?? 0;
  const onTimeActiveLoans = Math.max(activeLoans - overdueCount, 0);

  return (
    <section className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {scope === 'admin' ? 'Organization analytics' : 'Your circulation analytics'}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {scope === 'admin'
                ? 'Global circulation health across the catalog.'
                : 'Personal borrowing activity plus catalog-level availability.'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setRefreshTick((current) => current + 1)}
            loading={isRefreshing}
            loadingText="Refreshing..."
          >
            <RefreshCcw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="space-y-2 border-red-200 bg-red-50/80">
          <p className="text-sm font-semibold text-red-700">Unable to load dashboard</p>
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

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <AnalyticsCards
            scope={scope}
            totalBooks={totalBooks}
            availableBooks={availableBooks}
            activeLoans={activeLoans}
            overdueCount={overdueCount}
            myActiveLoans={overview?.myActiveLoans ?? 0}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
            <MonthlyCheckoutChart
              range={range}
              onRangeChange={setRange}
              monthlyCheckouts={overview?.monthlyCheckouts ?? []}
              monthlyCheckins={overview?.monthlyCheckins ?? []}
            />

            <CirculationBreakdownChart
              scope={scope}
              totalBooks={totalBooks}
              availableBooks={availableBooks}
              onTimeActiveLoans={onTimeActiveLoans}
              overdueCount={overdueCount}
              utilizationRate={utilizationRate}
            />
          </div>

          {overview ? <AiOverviewPanel analytics={overview} /> : null}
        </>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={`metric-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </Card>
        <Card className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </Card>
      </div>
    </>
  );
}
