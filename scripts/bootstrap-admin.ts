import { config as loadDotenv } from 'dotenv';

import { getAdminAuth } from '@/lib/firebase/admin';
import { setUserRole } from '@/lib/services/users';

loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ quiet: true });

function parseFlag(flag: string): string | undefined {
  const entry = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return entry?.split('=')[1];
}

async function run(): Promise<void> {
  const uidArg = parseFlag('--uid');
  const emailArg = parseFlag('--email');

  if (!uidArg && !emailArg) {
    throw new Error('Provide --uid=<uid> or --email=<email>');
  }

  let uid = uidArg;
  if (!uid && emailArg) {
    const userRecord = await getAdminAuth().getUserByEmail(emailArg);
    uid = userRecord.uid;
  }

  if (!uid) {
    throw new Error('Could not resolve uid');
  }

  await setUserRole(uid, 'admin');
  process.stdout.write(`User ${uid} was promoted to admin.\n`);
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
