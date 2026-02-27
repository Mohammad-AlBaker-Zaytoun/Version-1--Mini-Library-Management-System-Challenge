import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

import '@/app/globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';

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
    'Mobile-first library management system with Firebase auth, role-based access, circulation, AI metadata enrichment, and analytics.',
  openGraph: {
    title: 'Mini Library Management System',
    description:
      'Interview-ready Next.js library platform with Google SSO, Firestore, AI catalog assistant, and analytics.',
    url: appUrl,
    siteName: 'Mini Library Management System',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mini Library Management System',
    description:
      'Next.js + Firebase library platform with circulation workflows, RBAC, and AI-assisted cataloging.',
  },
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
      <body className={`${sans.variable} ${display.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
