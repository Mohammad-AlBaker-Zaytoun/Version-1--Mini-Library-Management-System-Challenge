import { GoogleGenAI } from '@google/genai';

import { getServerEnv } from '@/lib/env';
import {
  aiCatalogSuggestionOutputSchema,
  aiDashboardInsightOutputSchema,
  aiEnrichmentOutputSchema,
  type AiCatalogSuggestionInput,
  type AiCatalogSuggestionOutput,
  type AiDashboardInsightInput,
  type AiDashboardInsightOutput,
  type AiEnrichmentInput,
  type AiEnrichmentOutput,
} from '@/lib/schemas/ai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (aiClient) {
    return aiClient;
  }

  aiClient = new GoogleGenAI({ apiKey: getServerEnv().GEMINI_API_KEY });
  return aiClient;
}

function fallbackEnrichment(input: AiEnrichmentInput): AiEnrichmentOutput {
  const base = input.description?.trim() || `${input.title} by ${input.author}.`;
  const summary = base.length > 280 ? `${base.slice(0, 277)}...` : base;

  const candidateTags = [
    ...(input.tags ?? []),
    ...(input.genre ? [input.genre] : []),
    ...input.title
      .split(' ')
      .filter((word) => word.length > 4)
      .slice(0, 4),
  ];

  const uniqueTags = [...new Set(candidateTags.map((tag) => tag.trim()).filter(Boolean))].slice(
    0,
    6,
  );

  return {
    summary: summary.length < 20 ? `${input.title} is a notable work by ${input.author}.` : summary,
    suggestedGenre: input.genre?.trim() || 'General Fiction',
    suggestedTags: uniqueTags.length >= 2 ? uniqueTags : ['Library Pick', 'Recommended'],
  };
}

function buildPrompt(input: AiEnrichmentInput): string {
  return `You are a cataloging assistant for a modern library management system.
Return a strict JSON object with keys: summary, suggestedGenre, suggestedTags.
Constraints:
- summary: 2 to 4 concise sentences, max 400 chars.
- suggestedGenre: one normalized genre label.
- suggestedTags: 3 to 8 short tags.
Book context:
Title: ${input.title}
Author: ${input.author}
Current genre: ${input.genre ?? 'N/A'}
Current tags: ${(input.tags ?? []).join(', ') || 'N/A'}
Description: ${input.description ?? 'N/A'}
`;
}

export async function generateBookEnrichment(
  input: AiEnrichmentInput,
): Promise<AiEnrichmentOutput> {
  try {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildPrompt(input),
      config: {
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackEnrichment(input);
    }

    const parsed = JSON.parse(text) as unknown;
    const validated = aiEnrichmentOutputSchema.safeParse(parsed);

    if (!validated.success) {
      return fallbackEnrichment(input);
    }

    return validated.data;
  } catch {
    return fallbackEnrichment(input);
  }
}

function fallbackDashboardInsight(input: AiDashboardInsightInput): AiDashboardInsightOutput {
  const utilization =
    input.totalBooks > 0 ? Math.round((input.activeLoans / input.totalBooks) * 100) : 0;
  const overdueRate =
    input.activeLoans > 0 ? Math.round((input.overdueCount / input.activeLoans) * 100) : 0;

  const recent = input.monthlyCheckouts.slice(-3);
  const recentAverage =
    recent.length > 0
      ? Math.round(recent.reduce((sum, month) => sum + month.count, 0) / recent.length)
      : 0;
  const latest = input.monthlyCheckouts.at(-1)?.count ?? 0;
  const previous = input.monthlyCheckouts.at(-2)?.count ?? latest;
  const delta = latest - previous;

  const healthStatus: AiDashboardInsightOutput['healthStatus'] =
    overdueRate >= 35 ? 'critical' : overdueRate >= 20 ? 'watch' : 'stable';

  const trendText =
    delta === 0
      ? 'Checkout activity is flat month over month.'
      : `Checkout activity is ${delta > 0 ? 'up' : 'down'} by ${Math.abs(delta)} compared to the prior month.`;

  return {
    overview: `Current utilization is ${utilization}% with ${input.activeLoans} active loans and ${input.overdueCount} overdue items. ${trendText}`,
    healthStatus,
    highlights: [
      `${input.totalBooks} total books are currently tracked in this dashboard scope.`,
      `${input.activeLoans} books are checked out and ${Math.max(0, input.totalBooks - input.activeLoans)} are available.`,
      `Overdue pressure is ${overdueRate}% of active loans.`,
      `Average monthly checkouts over the latest ${recent.length || 1} months: ${recentAverage}.`,
    ].slice(0, 4),
    recommendations: [
      overdueRate >= 20
        ? 'Prioritize reminders and follow-ups for overdue borrowers this week.'
        : 'Maintain current circulation cadence and continue weekly overdue monitoring.',
      utilization >= 75
        ? 'Consider increasing high-demand inventory to reduce availability constraints.'
        : 'Use available inventory to promote circulation with targeted member picks.',
      delta < 0
        ? 'Run a short-term campaign to recover checkout momentum.'
        : 'Sustain current checkout momentum with rotating highlighted titles.',
    ],
  };
}

function buildDashboardPrompt(input: AiDashboardInsightInput): string {
  const recentMonths = input.monthlyCheckouts
    .slice(-12)
    .map((item) => `${item.month}: ${item.count}`)
    .join('; ');

  return `You are an operations analyst for a library platform.
Return strict JSON with keys: overview, healthStatus, highlights, recommendations.
Constraints:
- overview: 2-4 sentences, concrete, no fluff, max 700 chars.
- healthStatus: one of stable, watch, critical.
- highlights: 2-5 concise bullets.
- recommendations: 2-5 actionable bullets, operational and realistic.
Use only this dashboard data:
totalBooks=${input.totalBooks}
activeLoans=${input.activeLoans}
overdueCount=${input.overdueCount}
monthlyCheckouts=${recentMonths || 'none'}
`;
}

export async function generateDashboardInsight(
  input: AiDashboardInsightInput,
): Promise<AiDashboardInsightOutput> {
  try {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildDashboardPrompt(input),
      config: {
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackDashboardInsight(input);
    }

    const parsed = JSON.parse(text) as unknown;
    const validated = aiDashboardInsightOutputSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackDashboardInsight(input);
    }

    return validated.data;
  } catch {
    return fallbackDashboardInsight(input);
  }
}

function fallbackCatalogSuggestion(input: AiCatalogSuggestionInput): AiCatalogSuggestionOutput {
  const first = input.candidateBooks[0];
  if (!first) {
    return {
      recommendedBookId: 'fallback',
      reason:
        'A strong recommendation could not be generated because there are no candidate books available.',
      whyItFits: [
        'No available catalog candidates were provided for recommendation.',
        'Refresh after inventory changes to generate a personalized suggestion.',
      ],
    };
  }

  const topGenre = input.favoriteGenres[0];
  const topAuthor = input.favoriteAuthors[0];

  const matchReasons = [
    topGenre && first.genre && first.genre.toLowerCase() === topGenre.toLowerCase()
      ? `It aligns with your frequent ${topGenre} checkouts.`
      : null,
    topAuthor && first.author.toLowerCase() === topAuthor.toLowerCase()
      ? `You have engaged with this author in prior circulation activity.`
      : null,
    first.tags.some((tag) => input.favoriteTags.map((value) => value.toLowerCase()).includes(tag.toLowerCase()))
      ? `Its tags overlap with themes from your borrowing history.`
      : null,
  ].filter(Boolean) as string[];

  const whyItFits =
    matchReasons.length >= 2
      ? matchReasons.slice(0, 3)
      : [
          `It fits your checkout pattern from ${input.checkoutCount} recorded loans.`,
          `It is currently available and well-positioned for your next borrow.`,
          `The topic profile is similar to books in your recent circulation history.`,
        ];

  return {
    recommendedBookId: first.id,
    reason: `Based on your circulation history and available catalog options, "${first.title}" is a strong next checkout candidate.`,
    whyItFits,
  };
}

function buildCatalogSuggestionPrompt(input: AiCatalogSuggestionInput): string {
  const candidateLines = input.candidateBooks
    .map(
      (candidate) =>
        `${candidate.id} | ${candidate.title} | ${candidate.author} | genre=${candidate.genre || 'N/A'} | tags=${candidate.tags.join(', ') || 'N/A'} | description=${candidate.description || 'N/A'}`,
    )
    .join('\n');

  return `You are an AI librarian recommending the next book for one specific user.
Return strict JSON with keys: recommendedBookId, reason, whyItFits.
Constraints:
- recommendedBookId: must be one id from candidateBooks.
- reason: 2-4 concise sentences, max 500 chars, concrete and evidence-based.
- whyItFits: 2-5 concise bullet-style statements.
User context:
displayName=${input.userDisplayName}
checkoutCount=${input.checkoutCount}
checkinCount=${input.checkinCount}
favoriteGenres=${input.favoriteGenres.join(', ') || 'N/A'}
favoriteAuthors=${input.favoriteAuthors.join(', ') || 'N/A'}
favoriteTags=${input.favoriteTags.join(', ') || 'N/A'}
recentTitles=${input.recentTitles.join(', ') || 'N/A'}
candidateBooks:
${candidateLines}
`;
}

export async function generateCatalogSuggestion(
  input: AiCatalogSuggestionInput,
): Promise<AiCatalogSuggestionOutput> {
  try {
    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.0-flash',
      contents: buildCatalogSuggestionPrompt(input),
      config: {
        temperature: 0.2,
        topP: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return fallbackCatalogSuggestion(input);
    }

    const parsed = JSON.parse(text) as unknown;
    const validated = aiCatalogSuggestionOutputSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackCatalogSuggestion(input);
    }

    const candidateIds = new Set(input.candidateBooks.map((candidate) => candidate.id));
    if (!candidateIds.has(validated.data.recommendedBookId)) {
      return fallbackCatalogSuggestion(input);
    }

    return validated.data;
  } catch {
    return fallbackCatalogSuggestion(input);
  }
}
