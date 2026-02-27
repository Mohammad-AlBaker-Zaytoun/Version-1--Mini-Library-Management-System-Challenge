import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

import '@/app/globals.css';

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'Mini Library Management System',
    template: '%s | Mini Library Management System',
  },
  description:
    'Interview-ready, mobile-first mini library platform built incrementally with Next.js, Firebase, and AI.',
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
