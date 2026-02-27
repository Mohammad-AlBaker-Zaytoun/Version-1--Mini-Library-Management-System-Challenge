import { z } from 'zod';

export const enrichBookRequestSchema = z.object({
  title: z.string().trim().min(1).max(160),
  author: z.string().trim().min(1).max(120),
  isbn: z.string().trim().max(32).optional().or(z.literal('')),
  genre: z.string().trim().max(80).optional().or(z.literal('')),
  publishedYear: z
    .number()
    .int()
    .min(0)
    .max(new Date().getFullYear() + 1)
    .optional(),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const geminiEnrichmentSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  suggestedGenre: z.string().trim().min(1).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
});

const analyticsMonthSchema = z.object({
  month: z.string().trim().min(1).max(16),
  count: z.number().int().min(0),
});

export const dashboardAiInsightInputSchema = z.object({
  scope: z.enum(['admin', 'member']),
  totalBooks: z.number().int().min(0),
  availableBooks: z.number().int().min(0),
  activeLoans: z.number().int().min(0),
  overdueCount: z.number().int().min(0),
  utilizationRate: z.number().int().min(0).max(100),
  monthlyCheckouts: z.array(analyticsMonthSchema).max(24),
  monthlyCheckins: z.array(analyticsMonthSchema).max(24),
});

export const dashboardAiInsightOutputSchema = z.object({
  overview: z.string().trim().min(20).max(900),
  healthStatus: z.enum(['stable', 'watch', 'critical']),
  highlights: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
  recommendations: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
});

const catalogCandidateBookSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  author: z.string().trim().min(1).max(120),
  genre: z.string().trim().max(80).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  description: z.string().trim().max(700).optional().or(z.literal('')),
});

export const catalogAiSuggestionInputSchema = z.object({
  userDisplayName: z.string().trim().min(1).max(120),
  checkoutCount: z.number().int().min(0),
  checkinCount: z.number().int().min(0),
  favoriteGenres: z.array(z.string().trim().min(1).max(80)).max(5).default([]),
  favoriteTags: z.array(z.string().trim().min(1).max(40)).max(8).default([]),
  recentTitles: z.array(z.string().trim().min(1).max(160)).max(8).default([]),
  candidateBooks: z.array(catalogCandidateBookSchema).min(1).max(20),
});

export const catalogAiSuggestionOutputSchema = z.object({
  recommendedBookId: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(20).max(550),
  whyItFits: z.array(z.string().trim().min(8).max(180)).min(2).max(5),
});

export type EnrichBookRequestInput = z.infer<typeof enrichBookRequestSchema>;
export type GeminiEnrichmentOutput = z.infer<typeof geminiEnrichmentSchema>;
export type DashboardAiInsightInput = z.infer<typeof dashboardAiInsightInputSchema>;
export type DashboardAiInsightOutput = z.infer<typeof dashboardAiInsightOutputSchema>;
export type CatalogAiSuggestionInput = z.infer<typeof catalogAiSuggestionInputSchema>;
export type CatalogAiSuggestionOutput = z.infer<typeof catalogAiSuggestionOutputSchema>;
