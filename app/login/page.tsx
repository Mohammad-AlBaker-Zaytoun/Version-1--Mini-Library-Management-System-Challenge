import type { Metadata } from 'next';

import { LoginCard } from '@/components/auth/login-card';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in with Google SSO to access the mini library management system.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#fed7aa88,transparent_30%),radial-gradient(circle_at_80%_80%,#c7d2fe80,transparent_35%)]" />
      <div className="relative w-full max-w-md">
        <h1 className="mb-4 text-center font-[family-name:var(--font-display)] text-3xl text-[var(--text-primary)]">
          Welcome Back
        </h1>
        <LoginCard />
      </div>
    </main>
  );
}
