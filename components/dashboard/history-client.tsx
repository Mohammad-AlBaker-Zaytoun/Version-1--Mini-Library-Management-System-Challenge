'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { CirculationTransaction } from '@/lib/types';

export function HistoryClient() {
  const [items, setItems] = useState<CirculationTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/circulation/history?limit=150');
      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const payload = (await response.json()) as { items: CirculationTransaction[] };
      if (requestId !== requestIdRef.current) {
        return;
      }

      setItems(payload.items);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Failed to load history';
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Transaction History
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Immutable circulation ledger for audits and activity reviews.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadHistory()}
          loading={isLoading}
          loadingText="Refreshing..."
        >
          Refresh history
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <HistorySkeleton />
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No circulation activity yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="transform-gpu rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3 transition-[transform,box-shadow,border-color,background-color] duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-[#c8d4ff] motion-safe:hover:bg-[#f9fbff] motion-safe:hover:shadow-[0_16px_30px_-24px_rgba(31,52,166,0.45)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.action === 'checkout' ? 'default' : 'secondary'}>
                      {item.action}
                    </Badge>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.bookTitle}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Member: {item.memberName} | Actor: {item.actorName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={`history-skeleton-${index}`}
          className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}
