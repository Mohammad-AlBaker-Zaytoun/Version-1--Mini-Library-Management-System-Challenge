import type { Metadata } from 'next';

import { AnalyticsClient } from '@/components/dashboard/analytics-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Role-aware circulation analytics with overdue tracking and monthly trend insights.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardPage() {
  return <AnalyticsClient />;
}
