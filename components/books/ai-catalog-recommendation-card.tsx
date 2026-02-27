'use client';

import { BookHeart, RefreshCw, Sparkles } from 'lucide-react';

import { BookCoverImage } from '@/components/books/book-cover-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CatalogAiRecommendation } from '@/lib/types';

interface AiCatalogRecommendationCardProps {
  recommendation: CatalogAiRecommendation | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onFocusRecommendation: () => void;
}

export function AiCatalogRecommendationCard({
  recommendation,
  isLoading,
  error,
  onRefresh,
  onFocusRecommendation,
}: AiCatalogRecommendationCardProps) {
  if (isLoading && !recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">AI Next-Book Suggestion</CardTitle>
          <CardDescription>Analyzing your circulation behavior...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="mb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="inline-flex items-center gap-2 text-xl">
              <Sparkles className="h-4.5 w-4.5 text-[var(--brand-primary)]" />
              AI Next-Book Suggestion
            </CardTitle>
            <CardDescription>
              Personalized recommendation from your own checkout/checkin history.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
            loading={isLoading}
            loadingText="Refreshing..."
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh AI
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {recommendation?.recommendedBook ? (
          <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[linear-gradient(140deg,#f8faff_0%,#eef3ff_70%,#f7f5ff_100%)] p-3">
            <div className="flex gap-3">
              <BookCoverImage
                src={recommendation.recommendedBook.coverUrl}
                alt={`${recommendation.recommendedBook.title} cover`}
                width={128}
                height={184}
                sizes="64px"
                className="h-24 w-16 shrink-0 rounded-lg border border-[var(--border-subtle)]"
              />
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
                  <BookHeart className="h-3.5 w-3.5" />
                  Suggested Next Checkout
                </p>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {recommendation.recommendedBook.title}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {recommendation.recommendedBook.author}
                </p>
                {recommendation.recommendedBook.genre ? (
                  <Badge variant="muted">{recommendation.recommendedBook.genre}</Badge>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-6 text-[var(--text-primary)]">{recommendation.reason}</p>

            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
                Why this fits you
              </p>
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                {recommendation.whyItFits.map((reason, index) => (
                  <li key={`fit-${index}`} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onFocusRecommendation}>
                Find in catalog
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 px-3 py-2 text-sm text-[var(--text-muted)]">
            No personalized recommendation is available right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
