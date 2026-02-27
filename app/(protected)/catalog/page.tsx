import type { Metadata } from 'next';

import { CatalogClient } from '@/components/books/catalog-client';

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Browse, search, checkout, and return books with mobile-first interactions.',
  alternates: {
    canonical: '/catalog',
  },
};

export default function CatalogPage() {
  return <CatalogClient />;
}
