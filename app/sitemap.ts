import type { MetadataRoute } from 'next';

const DEFAULT_APP_URL = 'http://localhost:3000';

function getBaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return [
    // Keep sitemap scoped to indexable public pages.
    { url: `${baseUrl}/`, changeFrequency: 'monthly', priority: 1, lastModified },
    { url: `${baseUrl}/login`, changeFrequency: 'monthly', priority: 0.5, lastModified },
  ];
}
