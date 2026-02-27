import { z } from 'zod';

export const aiEnrichmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  author: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  genre: z.string().trim().max(80).optional().or(z.literal('')),
  tags: z.array(z.string().trim().max(40)).max(12).optional().default([]),
});

export const aiEnrichmentOutputSchema = z.object({
  summary: z.string().trim().min(20).max(400),
  suggestedGenre: z.string().trim().min(2).max(60),
  suggestedTags: z.array(z.string().trim().min(2).max(30)).min(2).max(8),
});

export const aiDashboardInsightInputSchema = z.object({
  totalBooks: z.number().int().min(0),
  activeLoans: z.number().int().min(0),
  overdueCount: z.number().int().min(0),
  monthlyCheckouts: z
    .array(
      z.object({
        month: z.string().trim().min(1).max(16),
        count: z.number().int().min(0),
      }),
    )
    .max(36)
    .default([]),
});

export const aiDashboardInsightOutputSchema = z.object({
  overview: z.string().trim().min(40).max(800),
  healthStatus: z.enum(['stable', 'watch', 'critical']),
  highlights: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
  recommendations: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
});

const aiCatalogCandidateBookSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  author: z.string().trim().min(1).max(120),
  genre: z.string().trim().max(80).optional().or(z.literal('')),
  tags: z.array(z.string().trim().max(40)).max(12).default([]),
  description: z.string().trim().max(600).optional().or(z.literal('')),
});

export const aiCatalogSuggestionInputSchema = z.object({
  userDisplayName: z.string().trim().min(1).max(120),
  checkoutCount: z.number().int().min(0),
  checkinCount: z.number().int().min(0),
  favoriteGenres: z.array(z.string().trim().min(2).max(60)).max(5).default([]),
  favoriteAuthors: z.array(z.string().trim().min(2).max(120)).max(5).default([]),
  favoriteTags: z.array(z.string().trim().min(2).max(40)).max(8).default([]),
  recentTitles: z.array(z.string().trim().min(1).max(160)).max(8).default([]),
  candidateBooks: z.array(aiCatalogCandidateBookSchema).min(1).max(20),
});

export const aiCatalogSuggestionOutputSchema = z.object({
  recommendedBookId: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(20).max(500),
  whyItFits: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
});

export type AiEnrichmentInput = z.infer<typeof aiEnrichmentSchema>;
export type AiEnrichmentOutput = z.infer<typeof aiEnrichmentOutputSchema>;
export type AiDashboardInsightInput = z.infer<typeof aiDashboardInsightInputSchema>;
export type AiDashboardInsightOutput = z.infer<typeof aiDashboardInsightOutputSchema>;
export type AiCatalogSuggestionInput = z.infer<typeof aiCatalogSuggestionInputSchema>;
export type AiCatalogSuggestionOutput = z.infer<typeof aiCatalogSuggestionOutputSchema>;
