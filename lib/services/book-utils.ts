import { toTitleCase } from '@/lib/utils';

export function normalizeTags(tags: string[] | undefined): string[] {
  const safeTags = tags ?? [];
  return [...new Set(safeTags.map((tag) => toTitleCase(tag.trim())).filter(Boolean))];
}

export function createSearchBlob(input: {
  title: string;
  author: string;
  genre?: string;
  isbn?: string;
  tags?: string[];
}): string {
  return [input.title, input.author, input.genre ?? '', input.isbn ?? '', ...(input.tags ?? [])]
    .join(' ')
    .toLowerCase();
}
