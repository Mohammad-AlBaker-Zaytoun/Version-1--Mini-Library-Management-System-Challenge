import Link from 'next/link';

import { PublicAppShell } from '@/components/layout/public-app-shell';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <PublicAppShell
      pageTitle="Elegant, Mobile-First Library UI"
      pageDescription="PR2 introduces the design system, responsive application shell, and SEO scaffolding. Business and auth logic are layered in upcoming PRs."
    >
      <Card className="space-y-4">
        <Badge variant="accent">Incremental Delivery</Badge>
        <CardTitle>Ready for feature layering</CardTitle>
        <CardDescription>
          The layout system and route scaffolding are now in place for authentication, RBAC, CRUD,
          circulation, AI, and analytics.
        </CardDescription>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/catalog" className={buttonClassName({ className: 'sm:w-auto' })}>
            Explore catalog scaffold
          </Link>
          <Link
            href="/login"
            className={buttonClassName({ variant: 'secondary', className: 'sm:w-auto' })}
          >
            Open sign-in scaffold
          </Link>
        </div>
      </Card>
    </PublicAppShell>
  );
}
