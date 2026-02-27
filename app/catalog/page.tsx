import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { redirect } from 'next/navigation';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse and search the catalog with mobile-first interactions.',
  alternates: {
    canonical: '/catalog',
  },
};

export default async function CatalogPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <PublicAppShell
      pageTitle="Catalog UI Scaffold"
      pageDescription="Search, filters, pagination, and circulation controls are progressively added in later branches."
    >
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Find books</CardTitle>
          <Badge variant="muted">Placeholder</Badge>
        </div>
        <CardDescription>
          This state demonstrates responsive spacing and card rhythm for mobile-first catalog design.
        </CardDescription>
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-muted)]/45 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Search className="h-4 w-4 text-[var(--brand-primary)]" />
            Search and filter controls
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Input fields, availability filters, and URL-bound query state arrive in PR5.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={`catalog-placeholder-${index}`} className="space-y-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    </PublicAppShell>
  );
}
