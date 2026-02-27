'use client';

import { BookMarked, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/providers/auth-provider';

export function LoginCard() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <Card className="group mx-auto max-w-md">
      <CardHeader>
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-primary-foreground)] transition-transform duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-105 motion-safe:group-hover:rotate-6">
          <BookMarked className="h-5 w-5" />
        </div>
        <CardTitle>Library Portal</CardTitle>
        <CardDescription>
          Sign in with your Google account to access the catalog, circulation tools, and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          onClick={() => void signInWithGoogle()}
          loading={loading}
          loadingText="Signing in..."
        >
          Continue with Google
        </Button>
        <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Sparkles className="h-3.5 w-3.5" />
          AI catalog assistant is available for admin users.
        </p>
      </CardContent>
    </Card>
  );
}
