'use client';

import { Activity, AlertTriangle, BookOpenText, RefreshCcw, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AiOverviewPanel } from '@/components/dashboard/ai-overview-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { AnalyticsOverview } from '@/lib/types';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS = [3, 6, 12] as const;

type RangeOption = (typeof RANGE_OPTIONS)[number];

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function DashboardClient() {
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
  const overduePressure = toPercent(overdueCount, Math.max(activeLoans, 1));

  const maxMonthlyCount = useMemo(() => {
    if (!overview) {
      return 1;
    }

    const allCounts = [
      ...overview.monthlyCheckouts.map((month) => month.count),
      ...overview.monthlyCheckins.map((month) => month.count),
    ];
    return Math.max(1, ...allCounts);
  }, [overview]);

  const donutSegments = useMemo(() => {
    const total = Math.max(totalBooks, 1);
    const availablePct = (availableBooks / total) * 100;
    const onTimePct = (onTimeActiveLoans / total) * 100;
    const overduePct = (overdueCount / total) * 100;
    return {
      availablePct,
      onTimePct,
      overduePct,
      gradient: `conic-gradient(
        #2446e8 0% ${availablePct}%,
        #11a06c ${availablePct}% ${availablePct + onTimePct}%,
        #d43f35 ${availablePct + onTimePct}% ${availablePct + onTimePct + overduePct}%,
        #e8ecfa ${availablePct + onTimePct + overduePct}% 100%
      )`,
    };
  }, [availableBooks, onTimeActiveLoans, overdueCount, totalBooks]);

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
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition-[background-color,color,transform] duration-300 ease-[var(--motion-smooth)]',
                    range === option
                      ? 'bg-[var(--brand-primary)] text-white shadow-[0_8px_16px_-12px_rgba(36,70,232,0.9)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]',
                  )}
                >
                  {option}M
                </button>
              ))}
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard
              label="Catalog size"
              value={totalBooks}
              icon={BookOpenText}
              tone="blue"
              helper={`${availableBooks} available now`}
            />
            <MetricCard
              label={scope === 'admin' ? 'Active loans' : 'Your active loans'}
              value={activeLoans}
              icon={Activity}
              tone="green"
              helper={
                scope === 'admin'
                  ? `${overview?.myActiveLoans ?? 0} linked to your account`
                  : `${Math.max(totalBooks - activeLoans, 0)} books not on your account`
              }
            />
            <MetricCard
              label={scope === 'admin' ? 'Overdue loans' : 'Your overdue loans'}
              value={overdueCount}
              icon={AlertTriangle}
              tone="red"
              helper={`Pressure ${overduePressure}% of active loans`}
            />
            <MetricCard
              label="Utilization"
              value={`${utilizationRate}%`}
              icon={TrendingUp}
              tone="blue"
              helper="Checked-out share of catalog"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Monthly circulation trend
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Checkouts and checkins for the selected {range}-month window.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2446e8]" />
                    Checkout
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#11a06c]" />
                    Checkin
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="flex min-w-[22rem] items-end gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-3">
                  {(overview?.monthlyCheckouts ?? []).map((checkoutMonth, index) => {
                    const checkinMonth = overview?.monthlyCheckins[index];
                    const checkoutHeight = Math.max(
                      10,
                      (checkoutMonth.count / maxMonthlyCount) * 110,
                    );
                    const checkinHeight = Math.max(
                      10,
                      ((checkinMonth?.count ?? 0) / maxMonthlyCount) * 110,
                    );

                    return (
                      <div
                        key={checkoutMonth.month}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <div className="flex h-28 items-end gap-1">
                          <span
                            className="w-3 rounded-t-md bg-[#2446e8] transition-all duration-700 ease-[var(--motion-smooth)]"
                            style={{ height: `${checkoutHeight}px` }}
                            title={`${checkoutMonth.month}: ${checkoutMonth.count} checkouts`}
                          />
                          <span
                            className="w-3 rounded-t-md bg-[#11a06c] transition-all duration-700 ease-[var(--motion-smooth)]"
                            style={{ height: `${checkinHeight}px` }}
                            title={`${checkoutMonth.month}: ${checkinMonth?.count ?? 0} checkins`}
                          />
                        </div>
                        <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                          {checkoutMonth.month}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Circulation composition
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Availability, active loans, and overdue pressure.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <div className="mx-auto h-40 w-40">
                  <div
                    className="relative h-full w-full rounded-full"
                    style={{ background: donutSegments.gradient }}
                  >
                    <div className="absolute inset-6 flex items-center justify-center rounded-full bg-[var(--surface-card)]">
                      <div className="text-center">
                        <p className="text-[10px] font-semibold tracking-[0.09em] text-[var(--text-muted)]">
                          UTILIZATION
                        </p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                          {utilizationRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <CompositionRow
                    label="Available"
                    value={availableBooks}
                    percent={toPercent(availableBooks, totalBooks)}
                    colorClass="bg-[#2446e8]"
                    surfaceClass="bg-[#eef2ff]"
                  />
                  <CompositionRow
                    label="On-time loans"
                    value={onTimeActiveLoans}
                    percent={toPercent(onTimeActiveLoans, totalBooks)}
                    colorClass="bg-[#11a06c]"
                    surfaceClass="bg-[#e7f7f0]"
                  />
                  <CompositionRow
                    label="Overdue"
                    value={overdueCount}
                    percent={toPercent(overdueCount, totalBooks)}
                    colorClass="bg-[#d43f35]"
                    surfaceClass="bg-[#fdecea]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs">
                <span className="text-[var(--text-secondary)]">Scope</span>
                <Badge variant={scope === 'admin' ? 'default' : 'muted'}>
                  {scope === 'admin' ? 'Admin view' : 'Member view'}
                </Badge>
              </div>
            </Card>
          </div>

          {overview ? <AiOverviewPanel analytics={overview} /> : null}
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'blue' | 'green' | 'red';
}) {
  const iconToneClass =
    tone === 'green'
      ? 'text-[#11825b] bg-[#e6f7ef]'
      : tone === 'red'
        ? 'text-[#c43f32] bg-[#fdecea]'
        : 'text-[#2446e8] bg-[#eef2ff]';

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
          {label}
        </p>
        <span className={cn('rounded-full p-2', iconToneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-3xl leading-none font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{helper}</p>
    </Card>
  );
}

function CompositionRow({
  label,
  value,
  percent,
  colorClass,
  surfaceClass,
}: {
  label: string;
  value: number;
  percent: number;
  colorClass: string;
  surfaceClass: string;
}) {
  return (
    <div
      className={cn('space-y-2 rounded-xl border border-[var(--border-subtle)] p-3', surfaceClass)}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {value} ({percent}%)
        </p>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-card)]/70">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-700 ease-[var(--motion-smooth)]',
            colorClass,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
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
