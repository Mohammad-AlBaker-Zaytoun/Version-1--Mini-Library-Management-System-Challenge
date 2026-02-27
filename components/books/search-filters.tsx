'use client';

import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BookSearchFiltersProps {
  q: string;
  author: string;
  genre: string;
  availability: 'all' | 'available' | 'checked_out';
  loading?: boolean;
  disabled?: boolean;
  onChange: (next: {
    q: string;
    author: string;
    genre: string;
    availability: 'all' | 'available' | 'checked_out';
  }) => void;
  onApply: () => void;
}

export function BookSearchFilters({
  q,
  author,
  genre,
  availability,
  loading = false,
  disabled = false,
  onChange,
  onApply,
}: BookSearchFiltersProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-soft)] transition-[transform,box-shadow] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_40px_-28px_rgba(20,35,115,0.45)]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={q}
          onChange={(event) => onChange({ q: event.target.value, author, genre, availability })}
          placeholder="Search title, author, tags"
          disabled={disabled}
        />
        <Input
          value={author}
          onChange={(event) => onChange({ q, author: event.target.value, genre, availability })}
          placeholder="Author"
          disabled={disabled}
        />
        <Input
          value={genre}
          onChange={(event) => onChange({ q, author, genre: event.target.value, availability })}
          placeholder="Genre"
          disabled={disabled}
        />
        <select
          value={availability}
          onChange={(event) =>
            onChange({
              q,
              author,
              genre,
              availability: event.target.value as 'all' | 'available' | 'checked_out',
            })
          }
          disabled={disabled}
          className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] transition-[border-color,box-shadow,background-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#b9c7ff] hover:shadow-[0_10px_20px_-16px_rgba(36,70,232,0.85)] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="checked_out">Checked out</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="secondary"
          onClick={onApply}
          loading={loading}
          loadingText="Applying filters"
          disabled={disabled}
        >
          <Search className="mr-2 h-4 w-4" />
          Apply filters
        </Button>
      </div>
    </div>
  );
}
