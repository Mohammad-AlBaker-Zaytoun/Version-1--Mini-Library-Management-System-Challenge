import type { Metadata } from 'next';

import { DashboardClient } from '@/components/dashboard/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Role-aware circulation analytics with overdue tracking and monthly trend insights.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
