import { z } from 'zod';

export const checkoutSchema = z
  .object({
    bookId: z.string().trim().min(1),
    memberUid: z.string().trim().min(1).optional(),
    dueDays: z.number().int().min(1).max(60).optional(),
    dueDate: z.string().datetime().optional(),
  })
  .refine((payload) => !(payload.dueDays && payload.dueDate), {
    message: 'Provide either dueDays or dueDate, not both',
    path: ['dueDays'],
  });

export const checkinSchema = z.object({
  bookId: z.string().trim().min(1),
  memberUid: z.string().trim().min(1).optional(),
});

export const circulationHistoryQuerySchema = z.object({
  action: z.enum(['checkout', 'checkin']).optional(),
  memberUid: z.string().trim().min(1).optional(),
  bookId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type CirculationHistoryQueryInput = z.infer<typeof circulationHistoryQuerySchema>;
