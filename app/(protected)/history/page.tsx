import type { Metadata } from 'next';

import { HistoryClient } from '@/components/dashboard/history-client';

export const metadata: Metadata = {
  title: 'History',
  description: 'Immutable transaction history and audit activity timeline.',
  alternates: {
    canonical: '/history',
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
