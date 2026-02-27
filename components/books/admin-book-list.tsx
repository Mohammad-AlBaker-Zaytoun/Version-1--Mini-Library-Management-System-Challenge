'use client';

import { Pencil, Trash2 } from 'lucide-react';

import { BookCoverImage } from '@/components/books/book-cover-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Book } from '@/lib/types';

interface AdminBookListProps {
  books: Book[];
  busyBookId: string | null;
  locked?: boolean;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => Promise<void>;
}

export function AdminBookList({
  books,
  busyBookId,
  locked = false,
  onDelete,
  onEdit,
}: AdminBookListProps) {
  if (books.length === 0) {
    return <Card className="text-sm text-[var(--text-muted)]">No books available yet.</Card>;
  }

  return (
    <div className="space-y-3">
      {books.map((book) => (
        <Card
          key={book.id}
          className="group flex transform-gpu flex-col gap-3 transition-[transform,box-shadow,border-color] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-[#c8d4ff] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex gap-3">
            <BookCoverImage
              src={book.coverUrl}
              alt={`${book.title} cover`}
              width={112}
              height={160}
              sizes="56px"
              className="h-20 w-14 shrink-0 rounded-lg border border-[var(--border-subtle)]"
            />
            <div className="space-y-1">
              <p className="font-semibold text-[var(--text-primary)] transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[var(--brand-primary)]">
                {book.title}
              </p>
              <p className="text-sm text-[var(--text-muted)] transition-colors duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[var(--text-secondary)]">
                {book.author}
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge variant={book.availability === 'available' ? 'secondary' : 'default'}>
                  {book.availability === 'available' ? 'Available' : 'Checked out'}
                </Badge>
                {book.genre ? <Badge variant="outline">{book.genre}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(book)} disabled={locked}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={locked}
              loading={busyBookId === book.id}
              loadingText="Deleting..."
              onClick={() => void onDelete(book)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
