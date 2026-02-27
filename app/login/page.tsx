import type { Metadata } from 'next';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in with Google SSO to access library workflows.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return (
    <PublicAppShell
      pageTitle="Sign-In Experience Scaffold"
      pageDescription="This route is styled and responsive. Firebase Google SSO wiring and session syncing are added in PR3."
    >
      <Card className="space-y-4">
        <Badge variant="muted">Coming next</Badge>
        <CardTitle>Google SSO Integration</CardTitle>
        <CardDescription>
          Authentication controls are intentionally deferred to the next branch to keep this PR
          scoped to layout and SEO foundations.
        </CardDescription>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/55 p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <LockKeyhole className="h-4 w-4 text-[var(--brand-primary)]" />
              Session Cookies
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Secure server session flow will protect private routes.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/55 p-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <ShieldCheck className="h-4 w-4 text-[#117151]" />
              Role-Aware Access
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              `admin` and `member` guards are introduced with Firebase profile sync.
            </p>
          </div>
        </div>
      </Card>
    </PublicAppShell>
  );
}
