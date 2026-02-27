export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 px-5 py-14 sm:px-8">
      <p className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        Foundation PR
      </p>
      <h1 className="text-4xl leading-tight font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
        Mini Library Management System
      </h1>
      <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
        Project baseline is ready. Next PRs add mobile-first UI shell, SEO, Firebase auth, RBAC,
        books CRUD, circulation workflows, AI features, and analytics.
      </p>
    </main>
  );
}
