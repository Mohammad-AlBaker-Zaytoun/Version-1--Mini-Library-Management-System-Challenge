import { z } from 'zod';

export const bookWriteSchema = z.object({
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
  coverUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  aiSummary: z.string().trim().max(600).optional().or(z.literal('')),
  aiSuggestedGenre: z.string().trim().max(80).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const bookUpdateSchema = bookWriteSchema
  .partial()
  .refine(
    (payload) => Object.keys(payload).length > 0,
    'At least one field must be provided for updates',
  );

export const booksQuerySchema = z.object({
  q: z.string().trim().optional(),
  author: z.string().trim().optional(),
  genre: z.string().trim().optional(),
  availability: z.enum(['available', 'checked_out']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type BookWriteInput = z.infer<typeof bookWriteSchema>;
export type BookUpdateInput = z.infer<typeof bookUpdateSchema>;
export type BooksQueryInput = z.infer<typeof booksQuerySchema>;
