'use client';

import { Activity, AlertTriangle, BookOpenText, TrendingUp } from 'lucide-react';
import type { ComponentType } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AnalyticsCards({
  scope,
  totalBooks,
  availableBooks,
  activeLoans,
  overdueCount,
  myActiveLoans,
}: {
  scope: 'admin' | 'member';
  totalBooks: number;
  availableBooks: number;
  activeLoans: number;
  overdueCount: number;
  myActiveLoans: number;
}) {
  const utilizationRate =
    totalBooks > 0 ? Math.max(0, Math.min(100, Math.round((activeLoans / totalBooks) * 100))) : 0;
  const overduePressure =
    activeLoans > 0
      ? Math.max(0, Math.min(100, Math.round((overdueCount / activeLoans) * 100)))
      : 0;

  return (
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
            ? `${myActiveLoans} linked to your account`
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
