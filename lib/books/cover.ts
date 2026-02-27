export const DEFAULT_BOOK_COVER_URL =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQI_gqLA2WfxJ3fL4vAXvyoEf8wbW-i8vDng&s';

export function getBookCoverUrl(coverUrl?: string | null): string {
  const trimmed = typeof coverUrl === 'string' ? coverUrl.trim() : '';
  return trimmed.length > 0 ? trimmed : DEFAULT_BOOK_COVER_URL;
}
