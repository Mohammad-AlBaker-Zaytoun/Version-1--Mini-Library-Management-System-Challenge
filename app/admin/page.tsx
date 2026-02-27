import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/api-auth';

export default async function AdminRootPage(): Promise<never> {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/catalog');
  }

  redirect('/admin/books' as Route);
}
