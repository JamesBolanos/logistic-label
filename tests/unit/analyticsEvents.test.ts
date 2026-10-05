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

  it('accepts the supported SSCC-only workflow metadata', () => {
    expect(
      sanitizeAnalyticsParameters('label_saved', {
        label_type: 'sscc_only',
        label_size: '4x6',
        template_version: 'v3'
      })
    ).toEqual({
      label_type: 'sscc_only',
      label_size: '4x6',
      template_version: 'v3'
    });
  });

  it('accepts the compact label size', () => {
    expect(
      sanitizeAnalyticsParameters('label_preview_succeeded', {
        label_type: 'sscc_only',
        label_size: '4x3',
        template_version: 'v3'
      })
    ).toMatchObject({ label_size: '4x3' });
  });

  it('accepts structured identical-contents metadata', () => {
    expect(
      sanitizeAnalyticsParameters('label_saved', {
        label_type: 'homogeneous_unit',
        label_size: '6x8',
        template_version: 'v4'
      })
    ).toEqual({
      label_type: 'homogeneous_unit',
      label_size: '6x8',
      template_version: 'v4'
    });
  });

  it('accepts only the current public contact placements', () => {
    expect(
      sanitizeAnalyticsParameters('custom_contact_clicked', {
        placement: 'home_hero',
        email: 'person@example.com'
      })
    ).toEqual({ placement: 'home_hero' });
    expect(
      sanitizeAnalyticsParameters('custom_contact_clicked', { placement: 'home_cta' })
    ).toEqual({ placement: 'home_cta' });
    expect(
      sanitizeAnalyticsParameters('custom_contact_clicked', { placement: 'guide_cta' })
    ).toEqual({ placement: 'guide_cta' });
    expect(sanitizeAnalyticsParameters('custom_contact_clicked', { placement: 'unknown' })).toEqual(
      {}
    );
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
