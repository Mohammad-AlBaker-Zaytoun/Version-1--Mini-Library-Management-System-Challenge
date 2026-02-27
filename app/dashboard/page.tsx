import type { Metadata } from 'next';
import { ChartNoAxesCombined, Sparkles } from 'lucide-react';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visual dashboard for circulation metrics and AI insights.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardPage() {
  return (
    <PublicAppShell
      pageTitle="Dashboard and Analytics Scaffold"
      pageDescription="Chart containers and responsive layout are ready. Real metrics and AI summaries are layered in later PRs."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {['Total books', 'Active loans', 'Overdue'].map((label) => (
          <Card key={label} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {label}
            </p>
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">Monthly trend</CardTitle>
            <Badge variant="muted">Chart placeholder</Badge>
          </div>
          <CardDescription>
            Animated trend chart and month toggles are added with real data in PR8.
          </CardDescription>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <ChartNoAxesCombined className="h-4 w-4 text-[var(--brand-primary)]" />
              Visualization container
            </p>
            <Skeleton className="mt-3 h-56 w-full rounded-2xl" />
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">AI brief</CardTitle>
            <Badge variant="accent">Planned</Badge>
          </div>
          <CardDescription>
            AI operational insight panel will summarize analytics and recommend actions.
          </CardDescription>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
              Insight placeholder
            </p>
            <Skeleton className="mt-3 h-24 w-full rounded-xl" />
          </div>
        </Card>
      </div>
    </PublicAppShell>
  );
}
