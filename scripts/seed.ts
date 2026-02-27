import { config as loadDotenv } from 'dotenv';

import { getServerEnv } from '@/lib/env';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { UserProfile } from '@/lib/types';

import { buildSeedDataset, SEED_COLLECTIONS } from './seed-data';
import {
  assertSafeProjectId,
  countCollectionDocuments,
  deleteCollectionInBatches,
  parseSeedArgs,
  setCollectionDocumentsInBatches,
} from './seed-utils';

const RESET_ORDER = [
  SEED_COLLECTIONS.transactions,
  SEED_COLLECTIONS.books,
  SEED_COLLECTIONS.users,
] as const;

loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ quiet: true });

function formatDurationMs(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}

async function resolveAdminAuthUser(adminEmail: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
}> {
  try {
    const userRecord = await getAdminAuth().getUserByEmail(adminEmail);
    return {
      uid: userRecord.uid,
      email: userRecord.email ?? adminEmail,
      displayName: userRecord.displayName ?? adminEmail.split('@')[0] ?? 'Admin',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not resolve Firebase Auth user for --admin-email=${adminEmail}. ` +
        `Ensure the account exists and has signed in at least once. Details: ${message}`,
    );
  }
}

async function upsertAdminProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  nowIso: string;
  dryRun: boolean;
}): Promise<string> {
  if (params.dryRun) {
    return `Would upsert admin profile for ${params.email} (${params.uid}).`;
  }

  const userRef = getAdminDb().collection(SEED_COLLECTIONS.users).doc(params.uid);
  const existingSnapshot = await userRef.get();
  const existingData = existingSnapshot.exists
    ? (existingSnapshot.data() as Partial<UserProfile>)
    : null;

  const profile: UserProfile = {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    role: 'admin',
    createdAt: existingData?.createdAt ?? params.nowIso,
    updatedAt: params.nowIso,
    lastLoginAt: existingData?.lastLoginAt ?? params.nowIso,
  };

  await userRef.set(profile, { merge: true });
  return `Upserted admin profile for ${params.email} (${params.uid}).`;
}

async function run(): Promise<void> {
  const startedAt = Date.now();
  const options = parseSeedArgs(process.argv.slice(2));
  const env = getServerEnv();
  const projectId = env.FIREBASE_PROJECT_ID;

  assertSafeProjectId(projectId, options.force);
  process.stdout.write(`\n[seed] Target Firebase project: ${projectId}\n`);
  process.stdout.write(`[seed] Mode: ${options.dryRun ? 'dry-run' : 'reset-and-seed'}\n`);

  const dataset = buildSeedDataset(new Date());
  const existingCounts = {
    [SEED_COLLECTIONS.users]: await countCollectionDocuments(SEED_COLLECTIONS.users),
    [SEED_COLLECTIONS.books]: await countCollectionDocuments(SEED_COLLECTIONS.books),
    [SEED_COLLECTIONS.transactions]: await countCollectionDocuments(SEED_COLLECTIONS.transactions),
  };

  let adminStatus = 'Not requested.';
  if (options.adminEmail) {
    const authUser = await resolveAdminAuthUser(options.adminEmail);
    adminStatus = await upsertAdminProfile({
      uid: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
      nowIso: dataset.generatedAtIso,
      dryRun: options.dryRun,
    });
  }

  const deletedCounts = {
    [SEED_COLLECTIONS.transactions]: 0,
    [SEED_COLLECTIONS.books]: 0,
    [SEED_COLLECTIONS.users]: 0,
  };

  const insertedCounts = {
    [SEED_COLLECTIONS.users]: 0,
    [SEED_COLLECTIONS.books]: 0,
    [SEED_COLLECTIONS.transactions]: 0,
  };

  if (options.dryRun) {
    deletedCounts[SEED_COLLECTIONS.transactions] = existingCounts[SEED_COLLECTIONS.transactions];
    deletedCounts[SEED_COLLECTIONS.books] = existingCounts[SEED_COLLECTIONS.books];
    deletedCounts[SEED_COLLECTIONS.users] = existingCounts[SEED_COLLECTIONS.users];
    insertedCounts[SEED_COLLECTIONS.users] = dataset.users.length;
    insertedCounts[SEED_COLLECTIONS.books] = dataset.books.length;
    insertedCounts[SEED_COLLECTIONS.transactions] = dataset.transactions.length;
  } else {
    for (const collectionName of RESET_ORDER) {
      const deleted = await deleteCollectionInBatches(collectionName);
      deletedCounts[collectionName] = deleted;
      process.stdout.write(`[seed] Deleted ${deleted} docs from ${collectionName}\n`);
    }

    insertedCounts[SEED_COLLECTIONS.users] = await setCollectionDocumentsInBatches(
      SEED_COLLECTIONS.users,
      dataset.users,
    );
    insertedCounts[SEED_COLLECTIONS.books] = await setCollectionDocumentsInBatches(
      SEED_COLLECTIONS.books,
      dataset.books,
    );
    insertedCounts[SEED_COLLECTIONS.transactions] = await setCollectionDocumentsInBatches(
      SEED_COLLECTIONS.transactions,
      dataset.transactions,
    );
  }

  const duration = formatDurationMs(Date.now() - startedAt);

  process.stdout.write('\n[seed] Summary\n');
  process.stdout.write(
    `[seed] Existing before reset -> users=${existingCounts.users}, books=${existingCounts.books}, circulationTransactions=${existingCounts.circulationTransactions}\n`,
  );
  process.stdout.write(
    `[seed] Deleted -> users=${deletedCounts.users}, books=${deletedCounts.books}, circulationTransactions=${deletedCounts.circulationTransactions}\n`,
  );
  process.stdout.write(
    `[seed] Inserted -> users=${insertedCounts.users}, books=${insertedCounts.books}, circulationTransactions=${insertedCounts.circulationTransactions}\n`,
  );
  process.stdout.write(`[seed] Admin status -> ${adminStatus}\n`);
  process.stdout.write(`[seed] Completed in ${duration}\n\n`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[seed] Failed: ${message}\n`);
  process.exitCode = 1;
});
