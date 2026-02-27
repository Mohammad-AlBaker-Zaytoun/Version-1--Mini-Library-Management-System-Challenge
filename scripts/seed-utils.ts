import type { Firestore } from 'firebase-admin/firestore';

const SAFE_PROJECT_ID_KEYWORDS = ['test', 'dev', 'staging', 'sandbox', 'demo'];
const DEFAULT_BATCH_SIZE = 450;

export interface SeedCliOptions {
  force: boolean;
  dryRun: boolean;
  adminEmail?: string;
}

export interface SeedDeleteSummary {
  circulationTransactions: number;
  books: number;
  users: number;
}

export interface SeedInsertSummary {
  circulationTransactions: number;
  books: number;
  users: number;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseSeedArgs(argv: string[]): SeedCliOptions {
  const options: SeedCliOptions = {
    force: false,
    dryRun: false,
  };

  for (const rawArg of argv) {
    const arg = rawArg.trim();

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--admin-email=')) {
      const email = arg.slice('--admin-email='.length).trim().toLowerCase();
      if (!email) {
        throw new Error('--admin-email requires a value (example: --admin-email=you@example.com)');
      }

      if (!isValidEmail(email)) {
        throw new Error(`Invalid --admin-email value: ${email}`);
      }

      options.adminEmail = email;
      continue;
    }

    throw new Error(`Unknown flag: ${arg}`);
  }

  return options;
}

export function projectIdLooksSafe(projectId: string): boolean {
  const normalized = projectId.toLowerCase();
  return SAFE_PROJECT_ID_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function assertProjectSafeForReset(projectId: string, force: boolean): void {
  if (force) {
    return;
  }

  if (projectIdLooksSafe(projectId)) {
    return;
  }

  throw new Error(
    `Safety guard blocked seeding for project "${projectId}". Use --force if this reset is intentional.`,
  );
}

export async function resetCollection(
  db: Firestore,
  collectionName: string,
  dryRun: boolean,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<number> {
  if (dryRun) {
    const aggregateSnapshot = await db.collection(collectionName).count().get();
    return Number(aggregateSnapshot.data().count ?? 0);
  }

  let deleted = 0;
  // Firestore does not support direct collection truncate. Delete in repeated batches.
  for (;;) {
    const snapshot = await db.collection(collectionName).limit(batchSize).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    for (const document of snapshot.docs) {
      batch.delete(document.ref);
    }

    await batch.commit();
    deleted += snapshot.size;
  }

  return deleted;
}

export async function insertDocuments<T extends { id: string }>(
  db: Firestore,
  collectionName: string,
  documents: T[],
  dryRun: boolean,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<number> {
  if (dryRun) {
    return documents.length;
  }

  for (let index = 0; index < documents.length; index += batchSize) {
    const chunk = documents.slice(index, index + batchSize);
    const batch = db.batch();

    for (const document of chunk) {
      batch.set(db.collection(collectionName).doc(document.id), document);
    }

    await batch.commit();
  }

  return documents.length;
}

export function formatDurationMs(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}
