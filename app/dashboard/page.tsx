import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { PublicAppShell } from '@/components/layout/public-app-shell';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Role-aware circulation analytics with overdue tracking and monthly trend insights.',
  alternates: {
    canonical: '/dashboard',
  },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <PublicAppShell
      pageTitle="Dashboard and Analytics"
      pageDescription="Track overdue pressure, circulation utilization, and monthly checkout trends with mobile-first visual analytics."
    >
      <DashboardClient />
    </PublicAppShell>
  );
}
