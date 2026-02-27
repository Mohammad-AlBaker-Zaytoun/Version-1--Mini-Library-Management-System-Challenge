import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/api-auth';

export default async function HomePage(): Promise<never> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  redirect('/catalog');
}
