import type { Metadata } from 'next';

import { AnalyticsClient } from '@/components/dashboard/analytics-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Monitor active loans, overdue books, and monthly checkout trends.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardPage() {
  return <AnalyticsClient />;
}
