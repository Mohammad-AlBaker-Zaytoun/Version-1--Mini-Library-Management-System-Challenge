import type { MetadataRoute } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/catalog', '/dashboard', '/history'],
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
