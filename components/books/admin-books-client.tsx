'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { AdminBookList } from '@/components/books/admin-book-list';
import { BookForm } from '@/components/books/book-form';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/auth/client';
import type { Book, BooksListResponse } from '@/lib/types';

export function AdminBooksClient() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyBookId, setBusyBookId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const booksRequestIdRef = useRef(0);

  const isMutating = isSaving || busyBookId !== null;
  const isLocked = isMutating || isRefreshing || isLoading;

  const loadBooks = useCallback(async () => {
    const requestId = ++booksRequestIdRef.current;
    setError(null);
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await authFetch('/api/books?limit=50&page=1');
      if (!response.ok) {
        throw new Error('Failed to load books');
      }

      const payload = (await response.json()) as BooksListResponse;
      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      setBooks(payload.items);
      hasLoadedOnceRef.current = true;
    } catch (cause) {
      if (requestId !== booksRequestIdRef.current) {
        return;
      }

      const message = cause instanceof Error ? cause.message : 'Failed to load books';
      setError(message);
    } finally {
      if (requestId === booksRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  async function getErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error ?? fallback;
    } catch {
      return fallback;
    }
  }

  async function createBook(payload: {
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    publishedYear?: number;
    coverUrl?: string;
    description?: string;
    tags: string[];
    aiSummary?: string;
    aiSuggestedGenre?: string;
  }) {
    if (isLocked) {
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const response = await authFetch('/api/books', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to create book'));
      }

      await loadBooks();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to create book';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateExistingBook(payload: {
    title: string;
    author: string;
    isbn?: string;
    genre?: string;
    publishedYear?: number;
    coverUrl?: string;
    description?: string;
    tags: string[];
    aiSummary?: string;
    aiSuggestedGenre?: string;
  }) {
    if (!editingBook || isLocked) {
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const response = await authFetch(`/api/books/${editingBook.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to update book'));
      }

      setEditingBook(null);
      await loadBooks();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to update book';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(book: Book) {
    if (isLocked) {
      return;
    }

    setError(null);
    setBusyBookId(book.id);
    try {
      const response = await authFetch(`/api/books/${book.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to delete book'));
      }

      if (editingBook?.id === book.id) {
        setEditingBook(null);
      }

      await loadBooks();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Failed to delete book';
      setError(message);
    } finally {
      setBusyBookId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Book Management
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Admin-only CRUD with validation and audit-friendly metadata.
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/80">
          <CardHeader className="mb-0 space-y-2">
            <CardTitle className="text-base text-red-700">Admin action failed</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadBooks()}
                loading={isLoading || isRefreshing}
                loadingText="Retrying..."
              >
                Reload data
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <BookForm mode="create" loading={isSaving} disabled={isLocked} onSubmit={createBook} />

      {editingBook ? (
        <BookForm
          mode="edit"
          loading={isSaving}
          disabled={isLocked}
          initialValues={editingBook}
          onSubmit={updateExistingBook}
          onCancel={() => {
            if (!isLocked) {
              setEditingBook(null);
            }
          }}
        />
      ) : null}

      {isRefreshing ? (
        <p className="animate-pulse text-xs text-[var(--text-muted)]">Refreshing admin list...</p>
      ) : null}

      {isLoading ? (
        <AdminBookListSkeleton />
      ) : (
        <AdminBookList
          books={books}
          busyBookId={busyBookId}
          locked={isLocked}
          onEdit={setEditingBook}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}

function AdminBookListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, index) => (
        <Card
          key={`admin-book-skeleton-${index}`}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );
}
