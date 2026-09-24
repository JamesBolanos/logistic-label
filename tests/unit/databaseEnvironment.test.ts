import { describe, expect, it } from 'vitest';
import {
  assertDatabaseEnvironment,
  resolveExpectedDatabaseEnvironment,
  type DatabaseConfiguration
} from '../../src/lib/server/db/databaseEnvironment.js';

const validConfiguration = {
  databaseUrl: 'postgresql://user:password@nonprod.example.test/database',
  databaseEnvironment: 'nonproduction',
  neonProjectId: 'nonprod-project',
  expectedNeonProjectId: 'nonprod-project'
} satisfies DatabaseConfiguration;

describe('database environment guard', () => {
  it('accepts a matching non-production target', () => {
    expect(
      assertDatabaseEnvironment(validConfiguration, {
        expectedEnvironment: 'nonproduction',
        operation: 'Migration'
      })
    ).toBe(validConfiguration.databaseUrl);
  });

  it('rejects missing safety variables without exposing values', () => {
    expect(() =>
      assertDatabaseEnvironment(
        { ...validConfiguration, expectedNeonProjectId: '' },
        { expectedEnvironment: 'nonproduction' }
      )
    ).toThrow('EXPECTED_NEON_PROJECT_ID');
  });

  it('rejects an environment mismatch', () => {
    expect(() =>
      assertDatabaseEnvironment(validConfiguration, {
        expectedEnvironment: 'production'
      })
    ).toThrow('database environment does not match');
  });

  it('rejects a Neon project mismatch', () => {
    expect(() =>
      assertDatabaseEnvironment(
        { ...validConfiguration, neonProjectId: 'different-project' },
        { expectedEnvironment: 'nonproduction' }
      )
    ).toThrow('Neon project identity does not match');
  });

  it('rejects a non-PostgreSQL URL', () => {
    expect(() =>
      assertDatabaseEnvironment(
        { ...validConfiguration, databaseUrl: 'https://example.test/database' },
        { expectedEnvironment: 'nonproduction' }
      )
    ).toThrow('must use PostgreSQL');
  });
});

describe('expected database environment', () => {
  it('uses production for a Vercel production deployment', () => {
    expect(resolveExpectedDatabaseEnvironment('production', 'nonproduction')).toBe('production');
  });

  it('uses production when APP_ENV identifies production', () => {
    expect(resolveExpectedDatabaseEnvironment(undefined, 'production')).toBe('production');
  });

  it.each([
    ['preview', 'nonproduction'],
    ['development', undefined]
  ])('uses nonproduction for the %s environment', (vercelEnvironment, appEnvironment) => {
    expect(resolveExpectedDatabaseEnvironment(vercelEnvironment, appEnvironment)).toBe(
      'nonproduction'
    );
  });
});
