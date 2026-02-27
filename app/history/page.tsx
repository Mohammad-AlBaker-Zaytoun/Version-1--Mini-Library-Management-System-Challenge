import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { HistoryClient } from '@/components/history/history-client';
import { PublicAppShell } from '@/components/layout/public-app-shell';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'History',
  description: 'Immutable transaction history and audit activity timeline.',
  alternates: {
    canonical: '/history',
  },
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <PublicAppShell
      pageTitle="Circulation History"
      pageDescription="Immutable checkout and checkin ledger with role-aware visibility and action filters."
    >
      <HistoryClient />
    </PublicAppShell>
  );
}
