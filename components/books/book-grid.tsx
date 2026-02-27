'use client';

import { formatDistanceToNow } from 'date-fns';
import { ArrowLeftRight, CalendarClock, CircleCheckBig, CircleDashed } from 'lucide-react';

import { BookCoverImage } from '@/components/books/book-cover-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Book, Role } from '@/lib/types';

interface BookGridProps {
  books: Book[];
  currentUserUid: string;
  role: Role;
  busyBookId: string | null;
  isMutating?: boolean;
  highlightedBookId?: string | null;
  onCheckout: (bookId: string) => Promise<void>;
  onCheckin: (bookId: string) => Promise<void>;
}

export function BookGrid({
  books,
  currentUserUid,
  role,
  busyBookId,
  isMutating = false,
  highlightedBookId = null,
  onCheckout,
  onCheckin,
}: BookGridProps) {
  if (books.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No books matched your filters</CardTitle>
          <CardDescription>
            Try a broader search or remove one of the active filters.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => {
        const isAvailable = book.availability === 'available';
        const isHighlighted = highlightedBookId === book.id;
        const canCheckIn =
          book.availability === 'checked_out' &&
          (role === 'admin' || book.borrowedByUid === currentUserUid);
        const dueIn = book.dueDate
          ? formatDistanceToNow(new Date(book.dueDate), { addSuffix: true })
          : null;

        return (
          <Card
            key={book.id}
            className={`group flex h-full transform-gpu flex-col transition-[transform,box-shadow,border-color,background-color] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-1 motion-safe:hover:border-[#c8d4ff] ${
              isHighlighted
                ? 'border-[#bfcfff] bg-[linear-gradient(145deg,#fbfcff_0%,#f0f4ff_100%)] shadow-[0_16px_30px_-22px_rgba(40,74,230,0.62)]'
                : ''
            }`}
          >
            <CardHeader>
              <BookCoverImage
                src={book.coverUrl}
                alt={`${book.title} cover`}
                width={320}
                height={480}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="mb-3 h-48 w-full rounded-xl border border-[var(--border-subtle)]"
              />
              <div className="flex items-center justify-between gap-2">
                <Badge variant={isAvailable ? 'secondary' : 'default'}>
                  {isAvailable ? 'Available' : 'Checked out'}
                </Badge>
                {book.genre ? <Badge variant="outline">{book.genre}</Badge> : null}
              </div>
              <CardTitle className="line-clamp-2 transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[var(--brand-primary)]">
                {book.title}
              </CardTitle>
              <CardDescription className="line-clamp-1 transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[var(--text-secondary)]">
                {book.author}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              {book.description ? (
                <p className="line-clamp-3 text-sm text-[var(--text-muted)] transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[var(--text-secondary)]">
                  {book.description}
                </p>
              ) : null}

              {book.availability === 'checked_out' ? (
                <div className="space-y-1 rounded-xl bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-secondary)] transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[var(--surface-strong)]">
                  <p className="flex items-center gap-1">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Borrowed by {book.borrowedByName ?? 'Unknown'}
                  </p>
                  {dueIn ? (
                    <p className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Due {dueIn}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {isAvailable ? (
                <Button
                  className="w-full"
                  onClick={() => void onCheckout(book.id)}
                  loading={busyBookId === book.id}
                  loadingText="Checking out..."
                  disabled={isMutating}
                >
                  <CircleDashed className="mr-2 h-4 w-4" />
                  Check out
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => void onCheckin(book.id)}
                  loading={busyBookId === book.id}
                  loadingText="Checking in..."
                  disabled={!canCheckIn || isMutating}
                >
                  <CircleCheckBig className="mr-2 h-4 w-4" />
                  Check in
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
