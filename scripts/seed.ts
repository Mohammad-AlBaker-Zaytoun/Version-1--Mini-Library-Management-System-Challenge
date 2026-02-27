import { config as loadDotenv } from 'dotenv';

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { UserProfile } from '@/lib/types';

import { buildSeedDataset } from './seed-data';
import {
  assertProjectSafeForReset,
  formatDurationMs,
  insertDocuments,
  parseSeedArgs,
  resetCollection,
  type SeedDeleteSummary,
  type SeedInsertSummary,
} from './seed-utils';

const COLLECTIONS = {
  users: 'users',
  books: 'books',
  circulationTransactions: 'circulationTransactions',
} as const;

loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ quiet: true });

function writeOut(message: string): void {
  process.stdout.write(`${message}\n`);
}

function readProjectIdOrThrow(): string {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID in environment');
  }

  return projectId;
}

async function upsertAdminByEmail(options: {
  adminEmail?: string;
  nowIso: string;
  dryRun: boolean;
}): Promise<string> {
  const { adminEmail, nowIso, dryRun } = options;
  if (!adminEmail) {
    return 'skipped';
  }

  let userRecord;
  try {
    userRecord = await getAdminAuth().getUserByEmail(adminEmail);
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : '';
    if (code.includes('user-not-found')) {
      throw new Error(
        `Could not resolve --admin-email "${adminEmail}" in Firebase Auth. Sign in once first, then rerun seeding.`,
      );
    }

    throw error;
  }

  const profile: UserProfile = {
    uid: userRecord.uid,
    email: userRecord.email ?? adminEmail,
    displayName: userRecord.displayName?.trim() || userRecord.email || adminEmail,
    role: 'admin',
    createdAt: nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
  };

  if (!dryRun) {
    await getAdminDb().collection(COLLECTIONS.users).doc(profile.uid).set(profile, { merge: true });
  }

  return dryRun ? `would upsert ${profile.uid}` : `upserted ${profile.uid}`;
}

async function run(): Promise<void> {
  const startedAt = Date.now();
  const cli = parseSeedArgs(process.argv.slice(2));
  const projectId = readProjectIdOrThrow();

  assertProjectSafeForReset(projectId, cli.force);

  writeOut(`[seed] project: ${projectId}`);
  writeOut(`[seed] mode: ${cli.dryRun ? 'dry-run' : 'write'}`);
  writeOut(`[seed] force: ${cli.force ? 'enabled' : 'disabled'}`);
  if (cli.adminEmail) {
    writeOut(`[seed] admin-email: ${cli.adminEmail}`);
  }

  const db = getAdminDb();
  const now = new Date();
  const nowIso = now.toISOString();
  const dataset = buildSeedDataset(now);

  const deleted: SeedDeleteSummary = {
    circulationTransactions: await resetCollection(
      db,
      COLLECTIONS.circulationTransactions,
      cli.dryRun,
    ),
    books: await resetCollection(db, COLLECTIONS.books, cli.dryRun),
    users: await resetCollection(db, COLLECTIONS.users, cli.dryRun),
  };

  const inserted: SeedInsertSummary = {
    users: await insertDocuments(
      db,
      COLLECTIONS.users,
      dataset.users.map((profile) => ({ id: profile.uid, ...profile })),
      cli.dryRun,
    ),
    books: await insertDocuments(db, COLLECTIONS.books, dataset.books, cli.dryRun),
    circulationTransactions: await insertDocuments(
      db,
      COLLECTIONS.circulationTransactions,
      dataset.circulationTransactions,
      cli.dryRun,
    ),
  };

  const adminEmailStatus = await upsertAdminByEmail({
    adminEmail: cli.adminEmail,
    nowIso,
    dryRun: cli.dryRun,
  });

  writeOut('[seed] summary');
  writeOut(`  project: ${projectId}`);
  writeOut(
    `  deleted: users=${deleted.users}, books=${deleted.books}, tx=${deleted.circulationTransactions}`,
  );
  writeOut(
    `  inserted: users=${inserted.users}, books=${inserted.books}, tx=${inserted.circulationTransactions}`,
  );
  writeOut(`  admin-email: ${adminEmailStatus}`);
  writeOut(`  runtime: ${formatDurationMs(Date.now() - startedAt)}`);
}

run().catch((error) => {
  process.stderr.write(
    `[seed] failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
