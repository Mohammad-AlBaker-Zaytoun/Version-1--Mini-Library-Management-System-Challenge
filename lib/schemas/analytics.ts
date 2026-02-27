import { z } from 'zod';

export const analyticsOverviewQuerySchema = z.object({
  rangeMonths: z.union([z.literal(3), z.literal(6), z.literal(12)]).default(6),
});

export type AnalyticsOverviewQueryInput = z.infer<typeof analyticsOverviewQuerySchema>;
