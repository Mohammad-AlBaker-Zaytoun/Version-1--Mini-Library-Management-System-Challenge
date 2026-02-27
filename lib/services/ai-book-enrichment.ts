import { getServerEnv } from '@/lib/env';
import type { EnrichBookRequestInput, GeminiEnrichmentOutput } from '@/lib/schemas/ai';
import { geminiEnrichmentSchema } from '@/lib/schemas/ai';
import { normalizeTags } from '@/lib/services/book-utils';
import type { BookAiEnrichmentResponse } from '@/lib/types';
import { toTitleCase } from '@/lib/utils';

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 12000;

const COMMON_STOPWORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'into',
  'about',
  'this',
  'that',
  'book',
  'story',
  'novel',
  'guide',
  'edition',
]);

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function toKeywordTags(input: EnrichBookRequestInput): string[] {
  const titleTags = input.title
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter((segment) => segment.length >= 4 && !COMMON_STOPWORDS.has(segment))
    .slice(0, 3)
    .map((segment) => toTitleCase(segment));

  const fallbackTags = [
    ...(input.genre ? [toTitleCase(input.genre)] : []),
    ...input.tags.map((tag) => toTitleCase(tag)),
    ...titleTags,
  ];

  return normalizeTags(fallbackTags).slice(0, 8);
}

function buildFallbackEnrichment(input: EnrichBookRequestInput): BookAiEnrichmentResponse {
  const tags = toKeywordTags(input);
  const suggestedGenre = input.genre?.trim()
    ? toTitleCase(input.genre)
    : tags[0] || 'General';

  const shortDescription = input.description
    ?.trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.trim();

  const yearText = typeof input.publishedYear === 'number' ? ` (${input.publishedYear})` : '';
  const baseSummary = shortDescription
    ? shortDescription
    : `${input.title}${yearText} by ${input.author} is a ${suggestedGenre.toLowerCase()} catalog title suitable for readers interested in ${tags.slice(0, 3).join(', ') || 'new discoveries'}.`;

  return {
    aiSummary: truncate(baseSummary, 600),
    aiSuggestedGenre: truncate(suggestedGenre, 80),
    tags: tags.length > 0 ? tags : ['General'],
    source: 'fallback',
  };
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

function buildPrompt(input: EnrichBookRequestInput): string {
  const seedTags = input.tags.length > 0 ? input.tags.join(', ') : 'none';

  return [
    'You are assisting a library administrator with metadata enrichment.',
    'Return only JSON with this exact shape:',
    '{"summary":"string","suggestedGenre":"string","tags":["string"]}',
    'Rules:',
    '- summary: objective, concise, max 280 characters.',
    '- suggestedGenre: single genre phrase, max 40 characters.',
    '- tags: 4-8 distinct tags, each max 24 characters.',
    '- Avoid markdown, commentary, or code fences.',
    '',
    'Book input:',
    `title: ${input.title}`,
    `author: ${input.author}`,
    `isbn: ${input.isbn?.trim() || 'n/a'}`,
    `genre: ${input.genre?.trim() || 'n/a'}`,
    `publishedYear: ${typeof input.publishedYear === 'number' ? input.publishedYear : 'n/a'}`,
    `description: ${input.description?.trim() || 'n/a'}`,
    `existingTags: ${seedTags}`,
  ].join('\n');
}

async function runGeminiEnrichment(input: EnrichBookRequestInput): Promise<GeminiEnrichmentOutput> {
  const env = getServerEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildPrompt(input),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 320,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const text = extractResponseText(payload);
    const parsed = extractJsonPayload(text);
    return geminiEnrichmentSchema.parse(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

export async function enrichBookMetadata(input: EnrichBookRequestInput): Promise<BookAiEnrichmentResponse> {
  const fallback = buildFallbackEnrichment(input);

  try {
    const aiOutput = await runGeminiEnrichment(input);
    return {
      aiSummary: truncate(aiOutput.summary.trim(), 600),
      aiSuggestedGenre: truncate(aiOutput.suggestedGenre.trim(), 80),
      tags: normalizeTags(aiOutput.tags).slice(0, 12),
      source: 'ai',
    };
  } catch {
    return fallback;
  }
}
