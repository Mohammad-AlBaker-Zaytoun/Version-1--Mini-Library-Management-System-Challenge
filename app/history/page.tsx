import type { Metadata } from 'next';
import { History } from 'lucide-react';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'History',
  description: 'Immutable transaction history and audit activity timeline.',
  alternates: {
    canonical: '/history',
  },
};

export default function HistoryPage() {
  return (
    <PublicAppShell
      pageTitle="History Timeline Scaffold"
      pageDescription="Responsive transaction timeline shell is ready for immutable circulation records."
    >
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Recent activity</CardTitle>
          <Badge variant="muted">Empty state</Badge>
        </div>
        <CardDescription>
          Checkout and checkin transaction rows are added in PR6 with role-aware filtering.
        </CardDescription>
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <History className="h-4 w-4 text-[var(--brand-primary)]" />
            Timeline preview
          </p>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={`history-placeholder-${index}`} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    </PublicAppShell>
  );
}
