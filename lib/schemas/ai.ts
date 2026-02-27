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

export type EnrichBookRequestInput = z.infer<typeof enrichBookRequestSchema>;
export type GeminiEnrichmentOutput = z.infer<typeof geminiEnrichmentSchema>;
