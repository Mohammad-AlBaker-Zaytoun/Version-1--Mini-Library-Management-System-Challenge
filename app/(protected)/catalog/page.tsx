import type { Metadata } from 'next';

import { CatalogClient } from '@/components/books/catalog-client';

export const metadata: Metadata = {
  title: 'Catalog',
  description: 'Search the catalog and manage check-in/check-out circulation operations.',
  alternates: {
    canonical: '/catalog',
  },
};

export default function CatalogPage() {
  return <CatalogClient />;
}
