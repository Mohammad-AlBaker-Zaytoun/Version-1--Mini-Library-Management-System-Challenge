# Mini Library Management System (Version 1)

[![CI](https://github.com/Mohammad-AlBaker-Zaytoun/Version-1--Mini-Library-Management-System-Challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/Mohammad-AlBaker-Zaytoun/Version-1--Mini-Library-Management-System-Challenge/actions/workflows/ci.yml)

Interview-ready, mobile-first library platform built with Next.js App Router, Firebase Auth/Firestore, and Gemini AI.

Live URL: `https://version-1-mini-library-management-s.vercel.app`

## Table of Contents

- [What This Project Demonstrates](#what-this-project-demonstrates)
- [Features](#features)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Firebase Setup](#firebase-setup)
- [Environment Variables](#environment-variables)
- [Quick Start for Reviewers](#quick-start-for-reviewers)
- [Local Development](#local-development)
- [Admin Role Bootstrap](#admin-role-bootstrap)
- [Database Seeding (Deterministic)](#database-seeding-deterministic)
- [API Reference](#api-reference)
- [Quality, Testing, and CI](#quality-testing-and-ci)
- [SEO](#seo)
- [Deployment (Vercel)](#deployment-vercel)
- [Submission Checklist](#submission-checklist)
- [Branch and PR Strategy](#branch-and-pr-strategy)
- [Known Limitations (v1)](#known-limitations-v1)

## What This Project Demonstrates

- Production-style App Router architecture with strict TypeScript.
- Firebase Google SSO session flow with server-side token verification.
- Role-based authorization (`admin`, `member`) and route/API guards.
- Full circulation lifecycle (checkout/checkin) with immutable history.
- AI features:
  - Admin metadata enrichment for book forms.
  - Dashboard AI operations brief from current analytics.
  - Catalog AI next-book recommendation personalized from user history.
- Deterministic Firestore seeding workflow for repeatable demos.

## Features

- Admin CRUD for books (create, edit, delete).
- Member/admin catalog browsing and search filters.
- Checkout/checkin with duplicate-checkout prevention.
- Overdue tracking and analytics dashboard with charts and tooltips.
- Mobile-first responsive UI and smooth loading/transition states.
- SEO baseline (`metadata`, canonical tags, `robots.txt`, `sitemap.xml`).

## Architecture

```mermaid
flowchart LR
  A[Client UI<br/>Next.js Pages + Components] --> B[Route Handlers<br/>/api/*]
  A --> C[Firebase Client Auth<br/>Google SSO]
  C --> B
  B --> D[Firebase Admin Auth]
  B --> E[(Firestore)]
  B --> F[Gemini API]
```

### Auth + Session + Profile Sync

```mermaid
sequenceDiagram
  participant U as User Browser
  participant FC as Firebase Client Auth
  participant API as Next.js API
  participant FA as Firebase Admin
  participant FS as Firestore

  U->>FC: Sign in with Google popup
  FC-->>U: ID token
  U->>API: POST /api/auth/session
  API->>FA: verifyIdToken + createSessionCookie
  API-->>U: httpOnly session cookie
  U->>API: POST /api/auth/sync
  API->>FA: verifyIdToken
  API->>FS: upsert users/{uid}
  API-->>U: profile (role + identity)
```

### Circulation Lifecycle

```mermaid
sequenceDiagram
  participant UI as Catalog UI
  participant API as /api/circulation/*
  participant DB as Firestore

  UI->>API: POST /checkout { bookId, loanDays }
  API->>DB: Transaction: validate availability + set checked_out + insert ledger entry
  DB-->>API: Updated book + tx
  API-->>UI: checkout result

  UI->>API: POST /checkin { bookId }
  API->>DB: Transaction: validate borrower/role + set available + insert ledger entry
  DB-->>API: Updated book + tx
  API-->>UI: checkin result
```

## Data Model

```mermaid
erDiagram
  USERS ||--o{ CIRCULATION_TRANSACTIONS : "memberUid"
  USERS ||--o{ BOOKS : "createdByUid"
  BOOKS ||--o{ CIRCULATION_TRANSACTIONS : "bookId"

  USERS {
    string uid PK
    string email
    string displayName
    string role
    string createdAt
    string updatedAt
    string lastLoginAt
  }

  BOOKS {
    string id PK
    string title
    string author
    string genre
    string availability
    string borrowedByUid
    string dueDate
    string searchBlob
    string createdByUid
    string updatedByUid
    string updatedAt
  }

  CIRCULATION_TRANSACTIONS {
    string id PK
    string bookId
    string action
    string memberUid
    string actorUid
    string dueDate
    string createdAt
  }
```

## Tech Stack

- Next.js 16 (App Router, TypeScript strict, no `src/` directory)
- Tailwind CSS v4 + reusable component primitives
- Firebase Auth (Google provider) + Firestore
- Gemini API via `@google/genai`
- Vitest (unit/integration) + Playwright (e2e)
- GitHub Actions CI
- Vercel deployment target
- `pnpm` package manager

## Project Structure

```text
app/
  (protected)/
    admin/books/
    catalog/
    dashboard/
    history/
  api/
    ai/enrich-book
    analytics/overview
    auth/session
    auth/sync
    books
    books/[id]
    catalog/ai-recommendation
    circulation/checkin
    circulation/checkout
    circulation/history
    dashboard/ai-overview
  layout.tsx
  robots.ts
  sitemap.ts
components/
lib/
scripts/
tests/
e2e/
proxy.ts
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Firebase project with:
  - Authentication enabled (Google provider)
  - Firestore database created
  - Service account credentials (Admin SDK)
- Gemini API key

## Firebase Setup

1. Create a Firebase project.
2. Create a Web App in Firebase and copy config values.
3. Enable `Authentication -> Sign-in method -> Google`.
4. Create Firestore database (Native mode).
5. Add authorized auth domains:
   - `localhost`
   - your Vercel production domain (after deployment)
6. Create a service account key:
   - `Project settings -> Service accounts -> Generate new private key`
   - copy `project_id`, `client_email`, `private_key` into `.env.local` values.

Note: `FIREBASE_PRIVATE_KEY` must keep newline escapes (`\n`) in env format.

## Environment Variables

Copy `.env.example` to `.env.local` and fill all values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (`http://localhost:3000` in local) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase web app id |
| `FIREBASE_PROJECT_ID` | Yes | Firebase Admin project id |
| `FIREBASE_CLIENT_EMAIL` | Yes | Firebase Admin client email |
| `FIREBASE_PRIVATE_KEY` | Yes | Firebase Admin private key (escaped with `\n`) |
| `GEMINI_API_KEY` | Yes | Gemini API key |

## Quick Start for Reviewers

```bash
pnpm install
pnpm dev
```

If you want deterministic demo data before reviewing:

```bash
pnpm seed:demo --admin-email=your-google-email@example.com
```

Recommended review path:

1. Sign in with Google.
2. Open `Catalog` and test search + checkout/checkin.
3. Open `Dashboard` and inspect analytics + AI overview.
4. Open `History` and verify immutable transaction records.
5. If signed in as admin, open `Manage Books` and test CRUD + AI enrichment.

## Local Development

```bash
pnpm install
pnpm dev
```

Open: `http://localhost:3000`

## Admin Role Bootstrap

Sign in once with Google first (so the profile exists), then promote your account:

```bash
pnpm bootstrap-admin --email=you@example.com
# or
pnpm bootstrap-admin --uid=YOUR_FIREBASE_UID
```

## Database Seeding (Deterministic)

The seed script performs a destructive reset of:

- `users`
- `books`
- `circulationTransactions`

and inserts deterministic demo data:

- 4 users
- 30 books
- 40 transactions
- 12 checked out books (5 overdue, 7 on-time)

### Commands

```bash
pnpm seed:demo
pnpm seed:demo --admin-email=your-google-email@example.com
pnpm seed:demo --dry-run --admin-email=your-google-email@example.com
pnpm seed:demo --force --admin-email=your-google-email@example.com
```

### Safety Guard

- By default, destructive seed is allowed only for project IDs containing:
  - `test`, `dev`, `staging`, `sandbox`, or `demo`
- Use `--force` only when you intentionally target another project id.

### Important

- Seeding does not create Firebase Auth users.
- `--admin-email` preserves your ability to access admin pages after reset by upserting your Firestore profile as admin.

## API Reference

### Authentication/session (internal flow)

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/session` | Public (token required in body) | Create secure session cookie from Firebase ID token |
| DELETE | `/api/auth/session` | Authenticated user | Clear session cookie |
| POST | `/api/auth/sync` | Public (token required in body) | Upsert user profile in `users/{uid}` |

### Books and search

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/books` | Authenticated | List/search/paginate books |
| POST | `/api/books` | Admin | Create book |
| GET | `/api/books/:id` | Authenticated | Get single book |
| PATCH | `/api/books/:id` | Admin | Update book |
| DELETE | `/api/books/:id` | Admin | Delete book |

`GET /api/books` query params:

- `q` (title/author/genre/isbn/tags search)
- `author`
- `genre`
- `availability` (`available` or `checked_out`)
- `page` (default `1`)
- `limit` (default `10`, max `50`)

### Circulation

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/circulation/checkout` | Member/Admin | Checkout a book |
| POST | `/api/circulation/checkin` | Member/Admin | Checkin a book |
| GET | `/api/circulation/history` | Authenticated | List immutable transaction history |

Notes:

- Members can only checkout/checkin for themselves.
- Admin can act for other users.
- Duplicate checkout on unavailable book is rejected.

### Analytics and AI

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/analytics/overview` | Authenticated | Dashboard metrics (`totalBooks`, `activeLoans`, `overdueCount`, `monthlyCheckouts`) |
| POST | `/api/dashboard/ai-overview` | Authenticated | AI operational summary and recommendations |
| POST | `/api/ai/enrich-book` | Admin | AI metadata enrichment for book forms |
| POST | `/api/catalog/ai-recommendation` | Authenticated | Personalized next-book recommendation |

## Role Matrix

| Capability | Member | Admin |
| --- | --- | --- |
| View catalog / search | Yes | Yes |
| Checkout / checkin own loans | Yes | Yes |
| Checkout/checkin on behalf of others | No | Yes |
| Manage books (CRUD) | No | Yes |
| AI enrichment for book forms | No | Yes |
| Dashboard analytics | Scoped | Full |

## Quality, Testing, and CI

### Local Quality Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

### CI Workflow

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

- Runs on pull requests and pushes to `main`
- Executes:
  - lint
  - typecheck
  - unit/integration tests
  - production build

## SEO

Implemented baseline SEO:

- Global metadata in `app/layout.tsx`
- Per-page metadata (`/login`, `/catalog`, `/dashboard`, `/history`, `/admin/books`)
- Canonical URLs via metadata `alternates`
- `app/robots.ts` for crawl rules + sitemap location
- `app/sitemap.ts` generating `/sitemap.xml`

## Deployment (Vercel)

1. Import repository into Vercel.
2. Add all env vars from `.env.example`.
3. Deploy.
4. Set `NEXT_PUBLIC_APP_URL=https://version-1-mini-library-management-s.vercel.app` in Vercel for production metadata, sitemap, and robots output.
5. In Firebase Auth, add your Vercel domain to authorized domains.
6. Verify:
   - `/robots.txt`
   - `/sitemap.xml`
   - Google SSO login in production

## Submission Checklist

Before sending this project to the company:

1. Verify Firebase Auth authorized domains include `version-1-mini-library-management-s.vercel.app`.
2. Confirm `NEXT_PUBLIC_APP_URL` is set to `https://version-1-mini-library-management-s.vercel.app` in Vercel.
3. Seed the production/demo Firestore project with:
   - `pnpm seed:demo --admin-email=your-google-email@example.com`
4. Smoke test:
   - Google sign-in
   - admin CRUD
   - AI enrichment
   - search/filter
   - checkout/checkin
   - history page
   - dashboard analytics + AI overview
   - `/robots.txt` and `/sitemap.xml`
5. Add screenshots or a short GIF walkthrough if you want a stronger recruiter/reviewer experience.

## Branch and PR Strategy

The project started with the original 10-PR roadmap, then added focused refinement PRs as the implementation matured:

1. `chore/01-foundation-readme-env`
2. `feat/02-ui-shell-seo`
3. `feat/03-firebase-auth-rbac`
4. `feat/04-books-crud`
5. `feat/05-search-filters`
6. `feat/06-circulation-checkin-checkout`
7. `feat/07-ai-catalog-assistant`
8. `feat/08-overdue-analytics`
9. `chore/09-quality-ci-readme-final`
10. `chore/10-firestore-seeding`
11. `feat/11-dashboard-catalog-ai-insights`
12. `feat/12-protected-layout-app-shell`
13. `refactor/13-dashboard-componentization`
14. `refactor/14-catalog-componentization`
15. `chore/15-seo-readme-polish`
16. `refactor/16-history-component-relocation`
17. `refactor/17-ai-service-consolidation`
18. `chore/18-admin-route-cleanup`
19. `chore/19-protected-page-metadata-guards`
20. `chore/20-app-shell-refresh`
21. `chore/21-seo-alignment`
22. `chore/22-auth-provider-token-normalization`
23. `chore/23-catalog-ai-card-copy-polish`
24. `test/24-unit-test-alignment`
25. `test/25-playwright-alignment`
26. `chore/26-final-snapshot-alignment`

## Known Limitations (v1)

- Search is currently done on a bounded dataset (`limit(500)`) before in-memory filtering.
- Firestore security rules are intentionally locked down because access is mediated through server APIs.
- E2E coverage is intentionally light (single smoke flow) for this version.
- AI outputs use deterministic fallbacks when provider output is invalid/unavailable.
