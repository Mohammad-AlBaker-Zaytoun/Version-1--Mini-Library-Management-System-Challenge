export interface SeedCliOptions {
  force: boolean;
  dryRun: boolean;
  adminEmail?: string;
}

export interface SeedDocument<T> {
  id: string;
  data: T;
}

const SAFE_PROJECT_TOKEN_REGEX = /(test|dev|staging|sandbox|demo)/i;

export function parseSeedArgs(args: string[]): SeedCliOptions {
  const options: SeedCliOptions = {
    force: false,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--admin-email=')) {
      const email = arg.slice('--admin-email='.length).trim();
      if (!email) {
        throw new Error('Expected a non-empty value for --admin-email');
      }
      options.adminEmail = email;
      continue;
    }

    if (arg === '--admin-email') {
      const nextArg = args[index + 1];
      if (!nextArg || nextArg.startsWith('--')) {
        throw new Error('Expected a value after --admin-email');
      }
      options.adminEmail = nextArg.trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown flag: ${arg}`);
  }

  return options;
}

export function isSafeProjectId(projectId: string): boolean {
  return SAFE_PROJECT_TOKEN_REGEX.test(projectId);
}

export function assertSafeProjectId(projectId: string, force: boolean): void {
  if (force || isSafeProjectId(projectId)) {
    return;
  }

  throw new Error(
    `Safety guard blocked destructive seed for project "${projectId}". ` +
      'Use --force only when you intentionally target this project.',
  );
}

async function getSeedDb() {
  const { getAdminDb } = await import('@/lib/firebase/admin');
  return getAdminDb();
}

export async function countCollectionDocuments(collectionName: string): Promise<number> {
  const db = await getSeedDb();
  const snapshot = await db.collection(collectionName).get();
  return snapshot.size;
}

export async function deleteCollectionInBatches(
  collectionName: string,
  batchSize = 450,
): Promise<number> {
  const db = await getSeedDb();
  let deletedCount = 0;

  while (true) {
    const snapshot = await db.collection(collectionName).limit(batchSize).get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deletedCount += snapshot.size;

    if (snapshot.size < batchSize) {
      break;
    }
  }

  return deletedCount;
}

export async function setCollectionDocumentsInBatches<T>(
  collectionName: string,
  documents: Array<SeedDocument<T>>,
  batchSize = 450,
): Promise<number> {
  const db = await getSeedDb();
  let insertedCount = 0;

  for (let index = 0; index < documents.length; index += batchSize) {
    const slice = documents.slice(index, index + batchSize);
    const batch = db.batch();

    for (const doc of slice) {
      batch.set(db.collection(collectionName).doc(doc.id), doc.data as DocumentData);
    }

    await batch.commit();
    insertedCount += slice.length;
  }

  return insertedCount;
}
import type { DocumentData } from 'firebase-admin/firestore';
