'use client';

import { AlertTriangle, CircleCheckBig, Library } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsCardsProps {
  activeLoans: number;
  overdueCount: number;
  totalBooks: number;
}

interface MetricCard {
  label: string;
  value: number;
  helper: string;
  colorClass: string;
  glowClass: string;
  progress: number;
  icon: React.ComponentType<{ className?: string }>;
}

function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function AnalyticsCards({ activeLoans, overdueCount, totalBooks }: AnalyticsCardsProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const availableBooks = Math.max(0, totalBooks - activeLoans);
  const onTimeLoans = Math.max(0, activeLoans - overdueCount);

  const metrics = useMemo<MetricCard[]>(
    () => [
      {
        label: 'Total books',
        value: totalBooks,
        helper: `${availableBooks} currently available`,
        colorClass: 'bg-[#2649ef]',
        glowClass: 'shadow-[0_10px_24px_-14px_rgba(38,73,239,0.8)]',
        progress: toPercent(availableBooks, Math.max(1, totalBooks)),
        icon: Library,
      },
      {
        label: 'Active loans',
        value: activeLoans,
        helper: `${onTimeLoans} on time`,
        colorClass: 'bg-[#0f9f6e]',
        glowClass: 'shadow-[0_10px_24px_-14px_rgba(15,159,110,0.8)]',
        progress: toPercent(activeLoans, Math.max(1, totalBooks)),
        icon: CircleCheckBig,
      },
      {
        label: 'Overdue items',
        value: overdueCount,
        helper: `${toPercent(overdueCount, Math.max(1, activeLoans))}% of active loans`,
        colorClass: 'bg-[#db4f3f]',
        glowClass: 'shadow-[0_10px_24px_-14px_rgba(219,79,63,0.78)]',
        progress: toPercent(overdueCount, Math.max(1, activeLoans)),
        icon: AlertTriangle,
      },
    ],
    [activeLoans, availableBooks, onTimeLoans, overdueCount, totalBooks],
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const progressWidth = ready ? `${Math.max(metric.progress, 4)}%` : '0%';

        return (
          <Card key={metric.label} className="group overflow-hidden">
            <CardHeader className="mb-0 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardDescription className="text-xs uppercase tracking-[0.08em]">
                    {metric.label}
                  </CardDescription>
                  <CardTitle className="text-3xl">{metric.value}</CardTitle>
                </div>
                <div
                  className={`rounded-full p-2 text-white ${metric.colorClass} ${metric.glowClass} transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-105`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-[var(--text-muted)]">{metric.helper}</p>
                <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                  <div
                    className={`h-2 rounded-full ${metric.colorClass} transition-[width,filter] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:brightness-110`}
                    style={{
                      width: progressWidth,
                      transitionDelay: `${index * 120}ms`,
                    }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
