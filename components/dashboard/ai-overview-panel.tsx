'use client';

import { Brain, CircleAlert, CircleCheckBig, RefreshCw, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { AnalyticsOverview, DashboardAiInsight } from '@/lib/types';

interface AiOverviewPanelProps {
  analytics: AnalyticsOverview;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function AiOverviewPanel({ analytics }: AiOverviewPanelProps) {
  const [insight, setInsight] = useState<DashboardAiInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatedKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const payload = useMemo(
    () => ({
      scope: analytics.scope,
      totalBooks: analytics.totalBooks,
      availableBooks: analytics.availableBooks,
      activeLoans: analytics.activeLoans,
      overdueCount: analytics.overdueCount,
      utilizationRate: analytics.utilizationRate,
      monthlyCheckouts: analytics.monthlyCheckouts,
      monthlyCheckins: analytics.monthlyCheckins,
    }),
    [
      analytics.activeLoans,
      analytics.availableBooks,
      analytics.monthlyCheckins,
      analytics.monthlyCheckouts,
      analytics.overdueCount,
      analytics.scope,
      analytics.totalBooks,
      analytics.utilizationRate,
    ],
  );
  const payloadKey = useMemo(() => JSON.stringify(payload), [payload]);

  const fetchInsight = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/dashboard/ai-overview', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payloadError = (await response.json()) as { error?: string };
        throw new Error(payloadError.error ?? 'Failed to generate AI overview');
      }

      const nextInsight = (await response.json()) as DashboardAiInsight;
      if (requestId !== requestIdRef.current) {
        return;
      }

      setInsight(nextInsight);
      generatedKeyRef.current = payloadKey;
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setError(getErrorMessage(cause, 'Failed to generate AI overview'));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [payload, payloadKey]);

  useEffect(() => {
    if (generatedKeyRef.current === payloadKey) {
      return;
    }

    void fetchInsight();
  }, [fetchInsight, payloadKey]);

  const statusConfig = useMemo(() => {
    const status = insight?.healthStatus ?? 'stable';

    if (status === 'critical') {
      return {
        label: 'Critical',
        className: 'bg-[#fee9e7] text-[#b53d2f]',
        icon: CircleAlert,
      };
    }

    if (status === 'watch') {
      return {
        label: 'Watch',
        className: 'bg-[#fff3e0] text-[#b36a00]',
        icon: CircleAlert,
      };
    }

    return {
      label: 'Stable',
      className: 'bg-[#e8faf3] text-[#0f8a61]',
      icon: CircleCheckBig,
    };
  }, [insight?.healthStatus]);

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="mb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="inline-flex items-center gap-2 text-xl sm:text-2xl">
              <Brain className="h-5 w-5 text-[var(--brand-primary)]" />
              AI Operations Brief
            </CardTitle>
            <CardDescription>
              AI summary generated from the current dashboard metrics on this page.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchInsight()}
              loading={isLoading}
              loadingText="Refreshing..."
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh AI
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !insight ? (
          <AiOverviewSkeleton />
        ) : (
          <>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="rounded-xl border border-[var(--border-subtle)] bg-[linear-gradient(140deg,#f8faff_0%,#eef3ff_70%,#f9f7ff_100%)] px-4 py-3">
              <p className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.1em] text-[var(--text-muted)] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Overview
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                {insight?.overview ?? 'No AI overview available yet.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.1em] text-[var(--text-muted)] uppercase">
                  Highlights
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
                  {(insight?.highlights ?? []).map((item, index) => (
                    <li key={`highlight-${index}`} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3">
                <p className="text-xs font-semibold tracking-[0.1em] text-[var(--text-muted)] uppercase">
                  Recommendations
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
                  {(insight?.recommendations ?? []).map((item, index) => (
                    <li key={`recommendation-${index}`} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0f9f6e]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AiOverviewSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </div>
  );
}
