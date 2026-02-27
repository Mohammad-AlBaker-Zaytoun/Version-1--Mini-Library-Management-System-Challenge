'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function CirculationBreakdownChart({
  scope,
  totalBooks,
  availableBooks,
  onTimeActiveLoans,
  overdueCount,
  utilizationRate,
}: {
  scope: 'admin' | 'member';
  totalBooks: number;
  availableBooks: number;
  onTimeActiveLoans: number;
  overdueCount: number;
  utilizationRate: number;
}) {
  const availablePct = (availableBooks / Math.max(totalBooks, 1)) * 100;
  const onTimePct = (onTimeActiveLoans / Math.max(totalBooks, 1)) * 100;
  const overduePct = (overdueCount / Math.max(totalBooks, 1)) * 100;

  const gradient = `conic-gradient(
    #2446e8 0% ${availablePct}%,
    #11a06c ${availablePct}% ${availablePct + onTimePct}%,
    #d43f35 ${availablePct + onTimePct}% ${availablePct + onTimePct + overduePct}%,
    #e8ecfa ${availablePct + onTimePct + overduePct}% 100%
  )`;

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Circulation composition</p>
        <p className="text-xs text-[var(--text-secondary)]">
          Availability, active loans, and overdue pressure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="mx-auto h-40 w-40">
          <div className="relative h-full w-full rounded-full" style={{ background: gradient }}>
            <div className="absolute inset-6 flex items-center justify-center rounded-full bg-[var(--surface-card)]">
              <div className="text-center">
                <p className="text-[10px] font-semibold tracking-[0.09em] text-[var(--text-muted)]">
                  UTILIZATION
                </p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{utilizationRate}%</p>
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
