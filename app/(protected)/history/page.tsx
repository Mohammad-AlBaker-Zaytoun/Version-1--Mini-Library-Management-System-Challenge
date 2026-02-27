import type { Metadata } from 'next';

import { HistoryClient } from '@/components/dashboard/history-client';

export const metadata: Metadata = {
  title: 'History',
  description: 'View immutable circulation transactions for audit and activity tracking.',
  alternates: {
    canonical: '/history',
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
