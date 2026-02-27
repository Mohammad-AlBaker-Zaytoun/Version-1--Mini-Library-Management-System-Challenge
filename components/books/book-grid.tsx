'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

type CirculationAction = 'checkout' | 'checkin' | 'none';

interface BookActionState {
  action: CirculationAction;
  label: string;
  disabled: boolean;
  hint?: string;
}

function truncateDescription(value: string | undefined, maxLength: number): string {
  if (!value) {
    return 'No description available yet.';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatDueDate(iso: string | undefined): string | null {
  if (!iso) {
    return null;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function isOverdue(iso: string | undefined): boolean {
  if (!iso) {
    return false;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

function getBookAction(book: Book, profile: UserProfile | null): BookActionState {
  if (!profile) {
    return {
      action: 'none',
      label: 'Unavailable',
      disabled: true,
      hint: 'You need to be signed in to manage circulation',
    };
  }

  if (book.availability === 'available') {
    return {
      action: 'checkout',
      label: 'Check out',
      disabled: false,
      hint: 'Starts a new loan and records a checkout transaction',
    };
  }

  if (profile.role === 'admin') {
    return {
      action: 'checkin',
      label: 'Check in',
      disabled: false,
      hint: 'Admin can process returns for active loans',
    };
  }

  if (book.borrowedByUid === profile.uid) {
    return {
      action: 'checkin',
      label: 'Return',
      disabled: false,
      hint: 'Complete your active loan',
    };
  }

  return {
    action: 'none',
    label: 'Borrowed',
    disabled: true,
    hint: `Currently borrowed by ${book.borrowedByName ?? 'another member'}`,
  };
}

export function CatalogBookGrid({
  books,
  profile,
  busyBookId,
  onCirculation,
}: {
  books: Book[];
  profile: UserProfile | null;
  busyBookId: string | null;
  onCirculation: (book: Book, action: 'checkout' | 'checkin') => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => {
        const actionState = getBookAction(book, profile);
        const dueDate = formatDueDate(book.dueDate);
        const overdue = isOverdue(book.dueDate);
        const isBookBusy = busyBookId === book.id;

        return (
          <Card
            key={book.id}
            className={cn(
              'flex h-full transform-gpu flex-col gap-3 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--motion-smooth)] hover:-translate-y-0.5 hover:border-[#c8d4ff]',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg leading-snug font-semibold text-[var(--text-primary)]">
                {book.title}
              </h3>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={book.availability === 'available' ? 'accent' : 'default'}>
                  {book.availability === 'available' ? 'Available' : 'Checked out'}
                </Badge>
                {overdue ? (
                  <Badge variant="muted" className="bg-[#fdecea] text-[#b9352a]">
                    Overdue
                  </Badge>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">by {book.author}</p>

            <div className="flex flex-wrap gap-1">
              {book.genre ? <Badge variant="muted">{book.genre}</Badge> : null}
              {typeof book.publishedYear === 'number' ? (
                <Badge variant="muted">{book.publishedYear}</Badge>
              ) : null}
            </div>

            {book.availability === 'checked_out' ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  Borrower:{' '}
                  <span className="font-semibold">{book.borrowedByName ?? 'Unknown'}</span>
                </p>
                <p
                  className={cn(
                    'text-xs',
                    overdue ? 'font-semibold text-[#c43f32]' : 'text-[var(--text-secondary)]',
                  )}
                >
                  {dueDate
                    ? `Due ${dueDate}${overdue ? ' (Overdue)' : ''}`
                    : 'Due date unavailable'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                Ready to borrow with a default 14-day due window.
              </p>
            )}

            <p className="text-xs leading-5 text-[var(--text-muted)]">
              {truncateDescription(book.description ?? book.aiSummary, 140)}
            </p>

            {book.tags.length > 0 ? (
              <div className="mt-auto flex flex-wrap gap-1">
                {book.tags.slice(0, 4).map((tag) => (
                  <Badge key={`${book.id}-${tag}`} variant="muted" className="text-[11px]">
                    #{tag}
                  </Badge>
                ))}
                {book.tags.length > 4 ? (
                  <Badge variant="muted" className="text-[11px]">
                    +{book.tags.length - 4}
                  </Badge>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1">
              <Button
                variant={actionState.action === 'checkin' ? 'secondary' : 'primary'}
                disabled={actionState.disabled || Boolean(busyBookId)}
                loading={isBookBusy}
                loadingText={
                  actionState.action === 'checkin' ? 'Checking in...' : 'Checking out...'
                }
                onClick={() => {
                  if (actionState.action !== 'none') {
                    onCirculation(book, actionState.action);
                  }
                }}
              >
                {actionState.label}
              </Button>
              {actionState.hint ? (
                <p className="text-[11px] text-[var(--text-muted)]">{actionState.hint}</p>
              ) : null}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function CatalogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={`catalog-loading-${index}`} className="space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}
