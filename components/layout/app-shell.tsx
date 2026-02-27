'use client';

import { BookOpenText, ChartNoAxesCombined, History, LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

type NavRoute = '/catalog' | '/history' | '/dashboard' | '/admin/books';
type NavItem = {
  href: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const memberLinks: NavItem[] = [
  { href: '/catalog', label: 'Catalog', icon: BookOpenText },
  { href: '/history', label: 'History', icon: History },
  { href: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
] as const;

const adminOnlyLinks: NavItem[] = [
  { href: '/admin/books', label: 'Manage Books', icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, signOutUser } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const links = profile?.role === 'admin' ? [...memberLinks, ...adminOnlyLinks] : memberLinks;

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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fce7c355,transparent_45%),radial-gradient(circle_at_bottom,#c9d8ff50,transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pt-4 pb-8 sm:px-6">
        <header className="sticky top-3 z-30 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/catalog"
              className="text-sm font-semibold tracking-wide text-[var(--text-primary)] sm:text-base"
            >
              Mini Library Management
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-[var(--surface-muted)] px-2 py-1 text-xs text-[var(--text-secondary)] sm:inline-flex">
                {profile?.displayName ?? 'Guest'} | {profile?.role ?? 'member'}
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
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex min-h-9 transform-gpu items-center gap-2 rounded-full px-3 text-sm transition-[transform,box-shadow,background-color,color] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] [&_svg]:text-current motion-safe:hover:-translate-y-0.5',
                    isActive
                      ? 'bg-[var(--brand-primary)] font-semibold !text-white shadow-[0_8px_20px_-12px_rgba(36,70,232,0.8)] motion-safe:hover:shadow-[0_14px_30px_-14px_rgba(36,70,232,0.9)] [&_svg]:!text-white'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-strong)] hover:shadow-[0_12px_24px_-20px_rgba(20,26,50,0.45)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span
                    className={cn(
                      'transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                      isActive ? '!text-white' : 'text-[var(--text-secondary)]',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mt-5 flex-1">{children}</main>
      </div>
    </div>
  );
}
