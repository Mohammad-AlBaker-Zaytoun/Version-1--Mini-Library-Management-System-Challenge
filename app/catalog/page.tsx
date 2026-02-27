import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CatalogClient } from '@/components/books/catalog-client';
import { PublicAppShell } from '@/components/layout/public-app-shell';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse, search, checkout, and return books with mobile-first interactions.',
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
      pageTitle="Catalog"
      pageDescription="Search by title, author, genre, tags, and availability, then process checkout and checkin actions with role-aware controls."
    >
      <CatalogClient />
    </PublicAppShell>
  );
}
