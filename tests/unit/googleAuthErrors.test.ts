import { describe, expect, it } from 'vitest';
import {
  getGoogleAuthErrorCallbackURL,
  getGoogleAuthErrorMessage,
  GOOGLE_AUTH_START_ERROR_MESSAGE
} from '../../src/lib/auth/googleAuthErrors.js';

describe('Google authentication errors', () => {
  it('explains a cancelled Google flow', () => {
    expect(getGoogleAuthErrorMessage('access_denied')).toBe(
      'Google sign-in was cancelled. You can try again when you are ready.'
    );
  });

  it('gives specific recovery advice for safe account errors', () => {
    expect(getGoogleAuthErrorMessage('email_not_found')).toContain('required to sign in');
    expect(getGoogleAuthErrorMessage('email_not_verified')).toContain('must be verified');
    expect(getGoogleAuthErrorMessage('unable_to_link_account')).toContain(
      'Sign in with the method you used before'
    );
  });

  it('uses a generic message for unknown provider errors', () => {
    expect(getGoogleAuthErrorMessage('private_provider_failure')).toBe(
      'Google sign-in could not be completed. Please try again or use email and password.'
    );
    expect(getGoogleAuthErrorMessage(null)).toBe('');
    expect(GOOGLE_AUTH_START_ERROR_MESSAGE).not.toContain('provider');
  });

  it('preserves a login destination in the same-origin error callback', () => {
    expect(getGoogleAuthErrorCallbackURL('/login', '/labels?type=sscc_only')).toBe(
      '/login?returnUrl=%2Flabels%3Ftype%3Dsscc_only'
    );
    expect(getGoogleAuthErrorCallbackURL('/signup')).toBe('/signup');
  });
});
