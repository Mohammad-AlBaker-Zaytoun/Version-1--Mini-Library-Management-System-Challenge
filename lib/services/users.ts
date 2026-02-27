import { getAdminDb } from '@/lib/firebase/admin';
import type { Role, UserProfile } from '@/lib/types';
import { nowIso } from '@/lib/utils';

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getAdminDb().collection(USERS_COLLECTION).doc(uid).get();
  if (!snapshot.exists) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function upsertUserProfile(input: {
  uid: string;
  email: string;
  displayName: string;
  role?: Role;
}): Promise<UserProfile> {
  const now = nowIso();
  const docRef = getAdminDb().collection(USERS_COLLECTION).doc(input.uid);
  const existingSnapshot = await docRef.get();

  if (existingSnapshot.exists) {
    const existing = existingSnapshot.data() as UserProfile;
    const updated: UserProfile = {
      ...existing,
      email: input.email,
      displayName: input.displayName,
      updatedAt: now,
      lastLoginAt: now,
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  const created: UserProfile = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    role: input.role ?? 'member',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };

  await docRef.set(created);
  return created;
}

export async function setUserRole(uid: string, role: Role): Promise<void> {
  const now = nowIso();
  await getAdminDb().collection(USERS_COLLECTION).doc(uid).set(
    {
      role,
      updatedAt: now,
    },
    { merge: true },
  );
}
