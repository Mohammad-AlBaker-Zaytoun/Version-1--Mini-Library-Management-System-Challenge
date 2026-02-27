'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AnalyticsCards } from '@/components/dashboard/analytics-cards';
import { AiOverviewPanel } from '@/components/dashboard/ai-overview-panel';
import { CirculationBreakdownChart } from '@/components/dashboard/circulation-breakdown-chart';
import { MonthlyCheckoutChart } from '@/components/dashboard/monthly-checkout-chart';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { AnalyticsOverview } from '@/lib/types';

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadAnalytics = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/analytics/overview');
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const payload = (await response.json()) as AnalyticsOverview;
      if (requestId !== requestIdRef.current) {
        return;
      }

      setData(payload);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Failed to load analytics';
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (error && !data) {
    return (
      <Card className="border-red-200 bg-red-50/80">
        <CardHeader>
          <CardTitle className="text-red-700">Unable to load dashboard</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
          <div>
            <Button onClick={() => void loadAnalytics()} loading={isLoading} loadingText="Retrying...">
              Retry
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const safeData: AnalyticsOverview = {
    activeLoans: data?.activeLoans ?? 0,
    overdueCount: data?.overdueCount ?? 0,
    totalBooks: data?.totalBooks ?? 0,
    monthlyCheckouts: data?.monthlyCheckouts ?? [],
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(135deg,#f8faff_0%,#edf2ff_55%,#f7f5ff_100%)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              Circulation Analytics
            </h1>
            <p className="max-w-2xl text-sm text-[var(--text-muted)]">
              Mobile-first operational dashboard with animated diagrams for utilization, loan health,
              and monthly checkout trends.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAnalytics()}
            loading={isLoading}
            loadingText="Refreshing..."
            className="w-full sm:w-auto"
          >
            Refresh analytics
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <AnalyticsCards
        activeLoans={safeData.activeLoans}
        overdueCount={safeData.overdueCount}
        totalBooks={safeData.totalBooks}
      />
      <AiOverviewPanel analytics={safeData} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <MonthlyCheckoutChart data={safeData.monthlyCheckouts} />
        <CirculationBreakdownChart
          totalBooks={safeData.totalBooks}
          activeLoans={safeData.activeLoans}
          overdueCount={safeData.overdueCount}
        />
      </div>
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="mb-0">
          <CardTitle>Loading analytics dashboard...</CardTitle>
          <CardDescription>Preparing charts and operational insights.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={`analytics-card-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-20" />
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="mb-0 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <div className="space-y-3 p-5 pt-1">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="mb-0 space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <div className="space-y-4 p-5 pt-1">
            <Skeleton className="h-56 w-full rounded-2xl sm:h-64" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={`analytics-month-skeleton-${index}`} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="mb-0 space-y-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <div className="space-y-3 p-5 pt-1">
            <Skeleton className="mx-auto h-48 w-48 rounded-full" />
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`analytics-breakdown-skeleton-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
