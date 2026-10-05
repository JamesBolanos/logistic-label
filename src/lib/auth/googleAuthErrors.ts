const CANCELLED_ERROR_CODES = new Set(['access_denied']);

const ACCOUNT_CONNECTION_ERROR_CODES = new Set([
  'unable_to_link_account',
  'email_does_not_match',
  'account_already_linked_to_different_user'
]);

export const GOOGLE_AUTH_START_ERROR_MESSAGE =
  'Unable to start Google sign-in. Please try again or use email and password.';

/**
 * Convert Better Auth's OAuth error code into user-facing copy. Provider
 * descriptions are deliberately ignored because they can expose technical or
 * account-specific details that do not help someone recover.
 */
export function getGoogleAuthErrorMessage(errorCode: string | null): string {
  const normalizedCode = errorCode?.trim().toLowerCase();

  if (!normalizedCode) return '';

  if (CANCELLED_ERROR_CODES.has(normalizedCode)) {
    return 'Google sign-in was cancelled. You can try again when you are ready.';
  }

  if (normalizedCode === 'email_not_found') {
    return 'Google did not provide the email address required to sign in. Try another Google account or use email and password.';
  }

  if (normalizedCode === 'email_not_verified') {
    return 'Your Google email address must be verified before it can be used to sign in.';
  }

  if (ACCOUNT_CONNECTION_ERROR_CODES.has(normalizedCode)) {
    return 'This Google account could not be connected. Sign in with the method you used before or try another Google account.';
  }

  return 'Google sign-in could not be completed. Please try again or use email and password.';
}

/** Build the same-origin page Better Auth should use after an OAuth failure. */
export function getGoogleAuthErrorCallbackURL(
  pagePath: '/login' | '/signup',
  returnUrl?: string
): string {
  if (!returnUrl) return pagePath;

  const searchParams = new URLSearchParams({ returnUrl });
  return `${pagePath}?${searchParams.toString()}`;
}
