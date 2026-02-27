import { describe, expect, it } from 'vitest';

import { assertProjectSafeForReset, parseSeedArgs } from '../../scripts/seed-utils';

describe('seed CLI arg parsing', () => {
  it('parses default mode with no flags', () => {
    expect(parseSeedArgs([])).toEqual({
      force: false,
      dryRun: false,
    });
  });

  it('parses force and dry-run flags with admin email', () => {
    expect(parseSeedArgs(['--force', '--dry-run', '--admin-email=You@Example.com'])).toEqual({
      force: true,
      dryRun: true,
      adminEmail: 'you@example.com',
    });
  });

  it('throws on unknown flags', () => {
    expect(() => parseSeedArgs(['--unknown'])).toThrow('Unknown flag: --unknown');
  });
});

describe('seed project safety guard', () => {
  it('passes for test-like project IDs', () => {
    expect(() => assertProjectSafeForReset('test-proj-eae95', false)).not.toThrow();
  });

  it('fails for production-like IDs without force', () => {
    expect(() => assertProjectSafeForReset('prod-library-main', false)).toThrow(
      'Safety guard blocked seeding',
    );
  });

  it('passes for production-like IDs when force is enabled', () => {
    expect(() => assertProjectSafeForReset('prod-library-main', true)).not.toThrow();
  });
});
