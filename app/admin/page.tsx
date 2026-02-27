import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin-only workspace placeholder for privileged actions.',
  alternates: {
    canonical: '/admin',
  },
};

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/catalog');
  }

  return (
    <PublicAppShell
      pageTitle="Admin Workspace Scaffold"
      pageDescription="Role-aware route guard is active. Admin-only feature modules (CRUD and advanced operations) are layered in upcoming PRs."
    >
      <Card className="space-y-3">
        <Badge variant="accent">Admin only</Badge>
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" />
          Access granted
        </CardTitle>
        <CardDescription>
          You are signed in with admin privileges. This page confirms RBAC route enforcement is
          active for protected admin workflows.
        </CardDescription>
      </Card>
    </PublicAppShell>
  );
}
