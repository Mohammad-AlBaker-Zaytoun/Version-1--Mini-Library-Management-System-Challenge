'use client';

import { BookOpenText, ChartNoAxesCombined, History, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';

type NavRoute = '/catalog' | '/history' | '/dashboard' | '/admin';

const memberNavItems: Array<{
  href: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: '/catalog', label: 'Catalog', icon: BookOpenText },
  { href: '/history', label: 'History', icon: History },
  { href: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
];

const adminNavItem = { href: '/admin', label: 'Admin', icon: ShieldCheck } as const;

interface PublicAppShellProps {
  pageTitle: string;
  pageDescription: string;
  children: React.ReactNode;
}

export function PublicAppShell({ pageTitle, pageDescription, children }: PublicAppShellProps) {
  const pathname = usePathname();
  const { profile, signOutUser } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const navItems = profile?.role === 'admin' ? [...memberNavItems, adminNavItem] : memberNavItems;

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOutUser();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[var(--surface-bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffe9c640,transparent_36%),radial-gradient(circle_at_bottom_right,#cbd8ff4d,transparent_45%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-4 pb-8 sm:px-6">
        <header className="sticky top-3 z-30 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-wide text-[var(--text-primary)] sm:text-base"
            >
              Mini Library Management
            </Link>
            {profile ? (
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-[var(--surface-muted)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] sm:inline-flex">
                  {profile.displayName} | {profile.role}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSignOut()}
                  loading={isSigningOut}
                  loadingText="Signing out..."
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            )}
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-[transform,box-shadow,background-color,color] duration-300 ease-[var(--motion-smooth)] hover:-translate-y-0.5',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-[0_10px_24px_-14px_rgba(36,70,232,0.9)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mt-5 space-y-4">
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(135deg,#f9fbff_0%,#edf2ff_64%,#fef7eb_100%)] p-4 shadow-[var(--shadow-soft)]">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {pageTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              {pageDescription}
            </p>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
