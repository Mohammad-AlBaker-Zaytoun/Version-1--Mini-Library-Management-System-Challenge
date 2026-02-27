'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Book } from '@/lib/types';

export interface BookFormValues {
  title: string;
  author: string;
  isbn: string;
  genre: string;
  publishedYear: string;
  coverUrl: string;
  description: string;
  tags: string;
}

interface BookFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Book>;
  loading?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  onSubmit: (payload: {
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
  }) => Promise<void>;
}

function toFormValues(initialValues?: Partial<Book>): BookFormValues {
  return {
    title: initialValues?.title ?? '',
    author: initialValues?.author ?? '',
    isbn: initialValues?.isbn ?? '',
    genre: initialValues?.genre ?? '',
    publishedYear: initialValues?.publishedYear ? String(initialValues.publishedYear) : '',
    coverUrl: initialValues?.coverUrl ?? '',
    description: initialValues?.description ?? '',
    tags: initialValues?.tags?.join(', ') ?? '',
  };
}

export function BookForm({
  mode,
  initialValues,
  loading,
  disabled,
  onCancel,
  onSubmit,
}: BookFormProps) {
  const [values, setValues] = useState<BookFormValues>(() => toFormValues(initialValues));
  const [error, setError] = useState<string | null>(null);
  const isLocked = Boolean(disabled || loading);

  const parsedTags = useMemo(
    () =>
      values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [values.tags],
  );

  function updateField<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit({
        title: values.title,
        author: values.author,
        isbn: values.isbn || undefined,
        genre: values.genre || undefined,
        publishedYear: values.publishedYear ? Number(values.publishedYear) : undefined,
        coverUrl: values.coverUrl || undefined,
        description: values.description || undefined,
        tags: parsedTags,
      });

      if (mode === 'create') {
        setValues(toFormValues());
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to save book';
      setError(message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add new book' : 'Edit book'}</CardTitle>
        <CardDescription>
          Admin-only book management with validation, audit fields, and responsive form layout.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => void handleSubmit(event)}
          aria-busy={isLocked}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={values.title}
                onChange={(event) => updateField('title', event.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                required
                value={values.author}
                onChange={(event) => updateField('author', event.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={values.isbn}
                onChange={(event) => updateField('isbn', event.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={values.genre}
                onChange={(event) => updateField('genre', event.target.value)}
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="publishedYear">Published year</Label>
              <Input
                id="publishedYear"
                value={values.publishedYear}
                onChange={(event) => updateField('publishedYear', event.target.value)}
                inputMode="numeric"
                disabled={isLocked}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coverUrl">Cover URL</Label>
              <Input
                id="coverUrl"
                value={values.coverUrl}
                onChange={(event) => updateField('coverUrl', event.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => updateField('description', event.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={values.tags}
              onChange={(event) => updateField('tags', event.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLocked}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="submit"
              loading={Boolean(loading)}
              loadingText="Saving..."
              disabled={isLocked}
            >
              {mode === 'create' ? 'Create book' : 'Save changes'}
            </Button>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
