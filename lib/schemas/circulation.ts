import { z } from 'zod';

export const checkoutSchema = z.object({
  bookId: z.string().trim().min(1),
  memberUid: z.string().trim().min(1).optional(),
  loanDays: z.number().int().min(1).max(45).default(14),
});

export const checkinSchema = z.object({
  bookId: z.string().trim().min(1),
});
