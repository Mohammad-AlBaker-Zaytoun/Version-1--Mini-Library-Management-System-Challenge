import { describe, expect, it } from 'vitest';

import { assertSafeProjectId, isSafeProjectId, parseSeedArgs } from '@/scripts/seed-utils';

describe('seed cli args', () => {
  it('parses default options', () => {
    expect(parseSeedArgs([])).toEqual({
      force: false,
      dryRun: false,
    });
  });

  it('parses force, dry-run, and admin-email flags', () => {
    expect(
      parseSeedArgs(['--force', '--dry-run', '--admin-email=seed.admin@library.demo']),
    ).toEqual({
      force: true,
      dryRun: true,
      adminEmail: 'seed.admin@library.demo',
    });
  });

  it('parses admin-email when value is provided as separate arg', () => {
    expect(parseSeedArgs(['--admin-email', 'reviewer@example.com'])).toEqual({
      force: false,
      dryRun: false,
      adminEmail: 'reviewer@example.com',
    });
  });

  it('throws on unknown flags', () => {
    expect(() => parseSeedArgs(['--unknown-flag'])).toThrow('Unknown flag');
  });
});

describe('seed safety guard', () => {
  it('accepts safe project ids by token', () => {
    expect(isSafeProjectId('test-proj-eae95')).toBe(true);
    expect(isSafeProjectId('team-dev-library')).toBe(true);
  });

  it('rejects production-like project ids when force is false', () => {
    expect(() => assertSafeProjectId('prod-library-main', false)).toThrow('Safety guard blocked');
  });

  it('allows any project when force is true', () => {
    expect(() => assertSafeProjectId('prod-library-main', true)).not.toThrow();
  });
});
