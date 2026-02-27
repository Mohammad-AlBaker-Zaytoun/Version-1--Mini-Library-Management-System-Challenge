'use client';

import { BookOpenText, ChartNoAxesCombined, History, LogIn } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';

import { cn } from '@/lib/utils';

type NavRoute = '/catalog' | '/history' | '/dashboard' | '/login';

const navItems: Array<{
  href: NavRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: '/catalog', label: 'Catalog', icon: BookOpenText },
  { href: '/history', label: 'History', icon: History },
  { href: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { href: '/login', label: 'Sign in', icon: LogIn },
];

interface PublicAppShellProps {
  pageTitle: string;
  pageDescription: string;
  children: React.ReactNode;
}

export function PublicAppShell({ pageTitle, pageDescription, children }: PublicAppShellProps) {
  const pathname = usePathname();

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
            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]">
              UI + SEO Scaffold
            </span>
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
