import { describe, expect, it } from 'vitest';
import {
  classifyHttpFailure,
  resolveAuthMethod,
  sanitizeAnalyticsParameters
} from '../../src/lib/analytics/events.js';

describe('analytics event contract', () => {
  it('keeps only allowlisted controlled parameters', () => {
    expect(
      sanitizeAnalyticsParameters('label_preview_succeeded', {
        label_type: 'homogeneous_unit',
        label_size: '4x6',
        template_version: 'v1',
        duration_ms: 12.6,
        email: 'person@example.com',
        gtin: '00012345600012'
      })
    ).toEqual({
      label_type: 'homogeneous_unit',
      label_size: '4x6',
      template_version: 'v1',
      duration_ms: 13
    });
  });

  it('rejects uncontrolled values and unsafe identifiers', () => {
    expect(
      sanitizeAnalyticsParameters('release_update_viewed', {
        release_id: 'release@example.com',
        change_category: 'planned',
        feature_key: 'release_history'
      })
    ).toEqual({ feature_key: 'release_history' });
  });

  it('classifies HTTP failures without exposing response contents', () => {
    expect(classifyHttpFailure(400)).toBe('validation');
    expect(classifyHttpFailure(401)).toBe('authentication');
    expect(classifyHttpFailure(404)).toBe('not_found');
    expect(classifyHttpFailure(429)).toBe('rate_limited');
    expect(classifyHttpFailure(503)).toBe('unexpected');
  });

  it('resolves supported authentication methods from Better Auth paths', () => {
    expect(resolveAuthMethod('/sign-up/email')).toBe('email');
    expect(resolveAuthMethod('/sign-in/email')).toBe('email');
    expect(resolveAuthMethod('/callback/google')).toBe('google');
    expect(resolveAuthMethod('/session')).toBe('unknown');
  });
});
