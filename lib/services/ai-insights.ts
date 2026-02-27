import { getServerEnv } from '@/lib/env';
import {
  catalogAiSuggestionOutputSchema,
  dashboardAiInsightOutputSchema,
  type CatalogAiSuggestionInput,
  type CatalogAiSuggestionOutput,
  type DashboardAiInsightInput,
  type DashboardAiInsightOutput,
} from '@/lib/schemas/ai';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 12000;

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function extractResponseText(response: GeminiGenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text)
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini response contained no text');
  }

  return text;
}

function extractJsonPayload(rawText: string): unknown {
  const fencedJsonMatch =
    rawText.match(/```json\s*([\s\S]*?)\s*```/i) ?? rawText.match(/```\s*([\s\S]*?)\s*```/i);
  const cleanPayload = (fencedJsonMatch ? fencedJsonMatch[1] : rawText).trim();
  return JSON.parse(cleanPayload);
}

async function runGeminiPrompt(prompt: string, maxOutputTokens: number): Promise<unknown> {
  const env = getServerEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            maxOutputTokens,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const text = extractResponseText(payload);
    return extractJsonPayload(text);
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackDashboardInsight(input: DashboardAiInsightInput): DashboardAiInsightOutput {
  const overdueRate =
    input.activeLoans > 0 ? Math.round((input.overdueCount / input.activeLoans) * 100) : 0;
  const latestCheckout = input.monthlyCheckouts.at(-1)?.count ?? 0;
  const previousCheckout = input.monthlyCheckouts.at(-2)?.count ?? latestCheckout;
  const checkoutDelta = latestCheckout - previousCheckout;
  const healthStatus: DashboardAiInsightOutput['healthStatus'] =
    overdueRate >= 35 ? 'critical' : overdueRate >= 20 ? 'watch' : 'stable';

  const trendText =
    checkoutDelta === 0
      ? 'Checkout activity is stable month-over-month.'
      : `Checkout activity moved by ${Math.abs(checkoutDelta)} ${checkoutDelta > 0 ? 'up' : 'down'} compared with the previous month.`;

  return {
    overview: `Current utilization is ${input.utilizationRate}% with ${input.activeLoans} active loans and ${input.overdueCount} overdue. ${trendText}`,
    healthStatus,
    highlights: [
      `${input.availableBooks} books are currently available out of ${input.totalBooks}.`,
      `Overdue pressure is ${overdueRate}% of active loans.`,
      `${input.scope === 'admin' ? 'Organization' : 'Member'} scope is currently in ${healthStatus} status.`,
    ],
    recommendations: [
      overdueRate >= 20
        ? 'Prioritize overdue reminders and check-in follow-up this week.'
        : 'Maintain current overdue follow-up rhythm and monitor weekly.',
      input.utilizationRate >= 75
        ? 'Consider expanding high-demand inventory to relieve utilization pressure.'
        : 'Promote available catalog inventory to increase healthy circulation.',
      checkoutDelta < 0
        ? 'Run a short campaign to recover checkout momentum.'
        : 'Continue highlighting popular genres to sustain circulation pace.',
    ],
  };
}

function buildDashboardPrompt(input: DashboardAiInsightInput): string {
  const checkoutSeries = input.monthlyCheckouts
    .map((item) => `${item.month}:${item.count}`)
    .join(', ');
  const checkinSeries = input.monthlyCheckins
    .map((item) => `${item.month}:${item.count}`)
    .join(', ');

  return [
    'You are an operations analyst for a library management platform.',
    'Return only JSON with this exact shape:',
    '{"overview":"string","healthStatus":"stable|watch|critical","highlights":["string"],"recommendations":["string"]}',
    'Rules:',
    '- overview: 2-4 concise sentences, max 800 chars.',
    '- highlights: 2-5 concise bullets.',
    '- recommendations: 2-5 actionable bullets.',
    '- healthStatus must be stable, watch, or critical.',
    '- No markdown, no code fences, no extra keys.',
    '',
    'Dashboard input:',
    `scope: ${input.scope}`,
    `totalBooks: ${input.totalBooks}`,
    `availableBooks: ${input.availableBooks}`,
    `activeLoans: ${input.activeLoans}`,
    `overdueCount: ${input.overdueCount}`,
    `utilizationRate: ${input.utilizationRate}`,
    `monthlyCheckouts: ${checkoutSeries || 'none'}`,
    `monthlyCheckins: ${checkinSeries || 'none'}`,
  ].join('\n');
}

export async function generateDashboardInsight(
  input: DashboardAiInsightInput,
): Promise<DashboardAiInsightOutput> {
  const fallback = fallbackDashboardInsight(input);

  try {
    const raw = await runGeminiPrompt(buildDashboardPrompt(input), 520);
    const parsed = dashboardAiInsightOutputSchema.safeParse(raw);
    if (!parsed.success) {
      return fallback;
    }

    return parsed.data;
  } catch {
    return fallback;
  }
}

function fallbackCatalogSuggestion(input: CatalogAiSuggestionInput): CatalogAiSuggestionOutput {
  const first = input.candidateBooks[0];
  if (!first) {
    return {
      recommendedBookId: 'none',
      reason: 'No candidate books were available for recommendation.',
      whyItFits: [
        'No available inventory matched your recommendation request.',
        'Try again after catalog availability changes.',
      ],
    };
  }

  const topGenre = input.favoriteGenres[0];
  const topTag = input.favoriteTags[0];

  return {
    recommendedBookId: first.id,
    reason: `Based on ${input.checkoutCount} prior checkouts, "${first.title}" is a strong next pick that fits your recent reading pattern and current catalog availability.`,
    whyItFits: [
      topGenre && first.genre
        ? `It aligns with your frequent ${topGenre} borrowing preference.`
        : 'It matches your recent circulation behavior.',
      topTag
        ? `Its themes overlap with your preferred tags, including ${topTag}.`
        : 'Its topic profile is close to what you usually borrow.',
      'It is available now, so you can check it out immediately.',
    ],
  };
}

function buildCatalogPrompt(input: CatalogAiSuggestionInput): string {
  const candidateLines = input.candidateBooks
    .map(
      (candidate) =>
        `${candidate.id} | ${candidate.title} | ${candidate.author} | genre=${candidate.genre || 'n/a'} | tags=${candidate.tags.join(', ') || 'n/a'} | description=${candidate.description || 'n/a'}`,
    )
    .join('\n');

  return [
    'You are an AI librarian recommending the next book for one member.',
    'Return only JSON with this exact shape:',
    '{"recommendedBookId":"string","reason":"string","whyItFits":["string"]}',
    'Rules:',
    '- recommendedBookId must be one of candidateBooks ids.',
    '- reason: 2-4 concise sentences, max 550 chars, evidence-based.',
    '- whyItFits: 2-5 concise bullets.',
    '- No markdown, no code fences, no extra keys.',
    '',
    'Member input:',
    `displayName: ${input.userDisplayName}`,
    `checkoutCount: ${input.checkoutCount}`,
    `checkinCount: ${input.checkinCount}`,
    `favoriteGenres: ${input.favoriteGenres.join(', ') || 'none'}`,
    `favoriteTags: ${input.favoriteTags.join(', ') || 'none'}`,
    `recentTitles: ${input.recentTitles.join(', ') || 'none'}`,
    'candidateBooks:',
    candidateLines,
  ].join('\n');
}

export async function generateCatalogSuggestion(
  input: CatalogAiSuggestionInput,
): Promise<CatalogAiSuggestionOutput> {
  const fallback = fallbackCatalogSuggestion(input);

  try {
    const raw = await runGeminiPrompt(buildCatalogPrompt(input), 420);
    const parsed = catalogAiSuggestionOutputSchema.safeParse(raw);
    if (!parsed.success) {
      return fallback;
    }

    const candidateIds = new Set(input.candidateBooks.map((candidate) => candidate.id));
    if (!candidateIds.has(parsed.data.recommendedBookId)) {
      return fallback;
    }

    return parsed.data;
  } catch {
    return fallback;
  }
}
