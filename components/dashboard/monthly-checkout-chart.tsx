'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS = [3, 6, 12] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

export function MonthlyCheckoutChart({
  range,
  onRangeChange,
  monthlyCheckouts,
  monthlyCheckins,
}: {
  range: RangeOption;
  onRangeChange: (nextRange: RangeOption) => void;
  monthlyCheckouts: Array<{ month: string; count: number }>;
  monthlyCheckins: Array<{ month: string; count: number }>;
}) {
  const maxMonthlyCount = Math.max(
    1,
    ...monthlyCheckouts.map((month) => month.count),
    ...monthlyCheckins.map((month) => month.count),
  );

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Monthly circulation trend
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Checkouts and checkins for the selected {range}-month window.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onRangeChange(option)}
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
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[22rem] items-end gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-3">
          {monthlyCheckouts.map((checkoutMonth, index) => {
            const checkinMonth = monthlyCheckins[index];
            const checkoutHeight = Math.max(10, (checkoutMonth.count / maxMonthlyCount) * 110);
            const checkinHeight = Math.max(
              10,
              ((checkinMonth?.count ?? 0) / maxMonthlyCount) * 110,
            );

            return (
              <div key={checkoutMonth.month} className="flex flex-1 flex-col items-center gap-1">
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
  );
}
