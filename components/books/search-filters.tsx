'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BookAvailability } from '@/lib/types';

export type AvailabilityFilter = '' | BookAvailability;

export interface CatalogFilterValues {
  q: string;
  author: string;
  genre: string;
  tags: string;
  availability: AvailabilityFilter;
  overdueOnly: boolean;
}

export function CatalogSearchFilters({
  filters,
  total,
  hasFilters,
  busyBookId,
  isRefreshing,
  onUpdate,
  onReset,
}: {
  filters: CatalogFilterValues;
  total: number;
  hasFilters: boolean;
  busyBookId: string | null;
  isRefreshing: boolean;
  onUpdate: (next: Partial<CatalogFilterValues>) => void;
  onReset: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Search className="h-4 w-4 text-[var(--brand-primary)]" />
            Find in catalog
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Filters sync with URL so results can be shared and revisited.
          </p>
        </div>
        <Badge variant="muted">
          {busyBookId
            ? 'Updating loan'
            : isRefreshing
              ? 'Refreshing'
              : `${total} result${total === 1 ? '' : 's'}`}
        </Badge>
      </div>

      <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="catalog-q">Search</Label>
            <Input
              id="catalog-q"
              placeholder="Title, author, genre, tags..."
              value={filters.q}
              onChange={(event) => onUpdate({ q: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="catalog-author">Author</Label>
            <Input
              id="catalog-author"
              placeholder="e.g. Toni Morrison"
              value={filters.author}
              onChange={(event) => onUpdate({ author: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="catalog-genre">Genre</Label>
            <Input
              id="catalog-genre"
              placeholder="e.g. Science Fiction"
              value={filters.genre}
              onChange={(event) => onUpdate({ genre: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="catalog-tags">Tags (comma separated)</Label>
            <Input
              id="catalog-tags"
              placeholder="classic, mystery"
              value={filters.tags}
              onChange={(event) => onUpdate({ tags: event.target.value })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="catalog-availability">Availability</Label>
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <select
                id="catalog-availability"
                value={filters.availability}
                onChange={(event) =>
                  onUpdate({ availability: event.target.value as AvailabilityFilter })
                }
                className="flex h-10 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] pr-3 pl-10 text-sm text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow,background-color] duration-300 ease-[var(--motion-smooth)] hover:border-[#b9c7ff] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:outline-none"
              >
                <option value="">All statuses</option>
                <option value="available">Available</option>
                <option value="checked_out">Checked out</option>
              </select>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="catalog-overdue-only"
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]"
            >
              <input
                id="catalog-overdue-only"
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(event) => onUpdate({ overdueOnly: event.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-subtle)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              Overdue only
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!hasFilters || Boolean(busyBookId)}
            className="sm:min-w-28"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </form>
    </Card>
  );
}
