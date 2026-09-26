import { describe, expect, it } from 'vitest';
import {
  createPasswordResetEmail,
  deliverPasswordResetEmail
} from '../../src/lib/server/email/passwordReset.js';
import {
  validatePasswordResetForm,
  validatePasswordResetRequest,
  validatePasswordValue
} from '../../src/lib/validation/formValidation.js';

describe('password recovery', () => {
  it('validates reset request email addresses', () => {
    expect(validatePasswordResetRequest({ email: 'person@example.com' }).isValid).toBe(true);
    expect(validatePasswordResetRequest({ email: 'not-an-email' }).errors.email).toBe(
      'Please enter a valid email address'
    );
  });

  it('requires a strong, matching replacement password', () => {
    expect(validatePasswordValue('password')).toBe(
      'Password must include uppercase, lowercase, and numbers'
    );
    expect(
      validatePasswordResetForm({ newPassword: 'Password123', confirmPassword: 'Different123' })
        .errors.confirmPassword
    ).toBe('Passwords do not match');
    expect(
      validatePasswordResetForm({ newPassword: 'Password123', confirmPassword: 'Password123' })
        .isValid
    ).toBe(true);
  });

  it('builds a plain-text and escaped HTML reset message', () => {
    const resetUrl = 'https://example.com/reset?token=a&value=<unsafe>';
    const message = createPasswordResetEmail(resetUrl);

    expect(message.subject).toBe('Reset your SSCC Labels password');
    expect(message.text).toContain(resetUrl);
    expect(message.html).toContain('token=a&amp;value=&lt;unsafe&gt;');
    expect(message.html).not.toContain('value=<unsafe>');
  });

  it('sends the reset message through the Resend HTTPS API', async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchImplementation: typeof fetch = async (input, init) => {
      requests.push({ input, init });
      return new Response(null, { status: 202 });
    };

    await deliverPasswordResetEmail(
      {
        apiKey: 'test-api-key',
        from: 'SSCC Labels <noreply@auth.sscc-labels.com>',
        to: 'owner@example.com',
        resetUrl: 'https://example.com/reset?token=test-token'
      },
      fetchImplementation
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.input).toBe('https://api.resend.com/emails');
    expect(requests[0]?.init?.method).toBe('POST');
    expect(requests[0]?.init?.headers).toEqual({
      Authorization: 'Bearer test-api-key',
      'Content-Type': 'application/json'
    });
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      from: 'SSCC Labels <noreply@auth.sscc-labels.com>',
      to: ['owner@example.com'],
      subject: 'Reset your SSCC Labels password',
      tags: [{ name: 'email_type', value: 'password_reset' }]
    });
  });

  it('rejects unsuccessful provider responses without exposing provider details', async () => {
    const fetchImplementation: typeof fetch = async () =>
      new Response('provider details', { status: 403 });

    await expect(
      deliverPasswordResetEmail(
        {
          apiKey: 'test-api-key',
          from: 'SSCC Labels <noreply@auth.sscc-labels.com>',
          to: 'owner@example.com',
          resetUrl: 'https://example.com/reset?token=test-token'
        },
        fetchImplementation
      )
    ).rejects.toThrow('The password reset email provider rejected the message.');
  });
});
