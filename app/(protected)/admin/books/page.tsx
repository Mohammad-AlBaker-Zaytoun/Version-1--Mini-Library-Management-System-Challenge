import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminBooksClient } from '@/components/books/admin-books-client';
import { getSessionUser } from '@/lib/auth/api-auth';

export const metadata: Metadata = {
  title: 'Manage Books',
  description: 'Admin workspace for creating, editing, and deleting books.',
  alternates: {
    canonical: '/admin/books',
  },
};

export default async function AdminBooksPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    redirect('/catalog');
  }

  return <AdminBooksClient />;
}
