import { describe, expect, it, vi } from 'vitest';
import { isCustomRequestRateLimited } from '../../src/lib/server/auth/ratelimit.js';
import {
  CUSTOM_REQUEST_TO,
  createCustomRequestEmail,
  deliverCustomRequestEmail
} from '../../src/lib/server/email/customRequest.js';
import { processCustomRequest } from '../../src/lib/server/requests/customRequest.js';
import { validateCustomRequest } from '../../src/lib/validation/customRequest.js';

const validRequest = {
  requestType: 'tailored_project',
  topic: 'printer_workflow',
  name: 'Taylor',
  email: 'taylor@example.com',
  company: 'Example Co',
  message: 'We need a custom printer workflow for our warehouse.'
} as const;

describe('custom request validation and email', () => {
  it('accepts a valid tailored project request and normalizes whitespace', () => {
    const result = validateCustomRequest({
      ...validRequest,
      email: '  taylor@example.com ',
      message: '  Please support a customer routing guide.  '
    });

    expect(result.valid).toBe(true);
    expect(result.values.email).toBe('taylor@example.com');
    expect(result.values.message).toBe('Please support a customer routing guide.');
  });

  it('rejects invalid categories, reply addresses, and out-of-range messages', () => {
    const result = validateCustomRequest({
      ...validRequest,
      requestType: 'unknown',
      topic: 'private_data',
      email: 'person@example.com\r\nBcc: other@example.com',
      message: 'short'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      requestType: expect.any(String),
      topic: expect.any(String),
      email: expect.any(String),
      message: expect.any(String)
    });
  });

  it('formats the email with a fixed subject and plain-text request details', () => {
    const message = createCustomRequestEmail(validRequest);

    expect(message.subject).toBe('New tailored project inquiry');
    expect(message.text).toContain('Topic: Printer workflow');
    expect(message.text).toContain('Reply email: taylor@example.com');
    expect(message.text).toContain(validRequest.message);
    expect(message).not.toHaveProperty('html');
  });

  it('sends request details only to the configured owner address', async () => {
    expect(CUSTOM_REQUEST_TO).toBe('jbolanosdiaz@gmail.com');
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchImplementation: typeof fetch = async (input, init) => {
      requests.push({ input, init });
      return new Response(null, { status: 202 });
    };

    await deliverCustomRequestEmail(
      {
        apiKey: 'test-api-key',
        from: 'SSCC Labels <noreply@example.com>',
        to: CUSTOM_REQUEST_TO,
        request: validRequest
      },
      fetchImplementation
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.input).toBe('https://api.resend.com/emails');
    expect(requests[0]?.init?.method).toBe('POST');
    expect(requests[0]?.init?.headers).toMatchObject({
      Authorization: 'Bearer test-api-key',
      'Content-Type': 'application/json'
    });
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      from: 'SSCC Labels <noreply@example.com>',
      to: ['jbolanosdiaz@gmail.com'],
      reply_to: 'taylor@example.com',
      subject: 'New tailored project inquiry',
      tags: [
        { name: 'email_type', value: 'custom_request' },
        { name: 'request_type', value: 'tailored_project' }
      ]
    });
  });

  it('returns clear errors when the email provider rejects or cannot receive a request', async () => {
    await expect(
      deliverCustomRequestEmail(
        {
          apiKey: 'test-api-key',
          from: 'SSCC Labels <noreply@example.com>',
          to: 'owner@example.com',
          request: validRequest
        },
        async () => new Response('provider detail', { status: 403 })
      )
    ).rejects.toThrow('The custom request email provider rejected the message.');

    await expect(
      deliverCustomRequestEmail(
        {
          apiKey: 'test-api-key',
          from: 'SSCC Labels <noreply@example.com>',
          to: 'owner@example.com',
          request: validRequest
        },
        async () => {
          throw new Error('network unavailable');
        }
      )
    ).rejects.toThrow('The custom request email provider is unavailable.');
  });
});

describe('public request processing', () => {
  it('sends a valid form and returns only a controlled request category', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const result = await processCustomRequest({
      values: validRequest,
      clientAddress: 'test-valid',
      sendEmail
    });

    expect(result).toEqual({
      status: 200,
      data: { success: true, requestType: 'tailored_project' }
    });
    expect(sendEmail).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        requestType: 'tailored_project',
        email: 'taylor@example.com',
        message: validRequest.message
      })
    );
  });

  it('rejects invalid forms without sending email and preserves submitted values', async () => {
    const sendEmail = vi.fn();
    const result = await processCustomRequest({
      values: { ...validRequest, email: 'not-an-email' },
      clientAddress: 'test-invalid',
      sendEmail
    });

    expect(result.status).toBe(400);
    if (result.status !== 400) throw new Error('Expected request validation to fail.');
    expect(result.data).toMatchObject({
      values: { email: 'not-an-email' },
      errors: { email: expect.any(String) }
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects honeypot submissions without sending email', async () => {
    const sendEmail = vi.fn();
    const result = await processCustomRequest({
      values: { ...validRequest, website: 'https://spam.example' },
      clientAddress: 'test-honeypot',
      sendEmail
    });

    expect(result.status).toBe(400);
    if (result.status !== 400) throw new Error('Expected honeypot submission to fail.');
    expect(result.data.message).toContain('could not accept');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('preserves form values and provides an email fallback when delivery fails', async () => {
    const sendEmail = vi.fn().mockRejectedValue(new Error('provider unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const result = await processCustomRequest({
        values: validRequest,
        clientAddress: 'test-delivery-failure',
        sendEmail
      });

      expect(result.status).toBe(503);
      if (result.status !== 503) throw new Error('Expected email delivery to fail.');
      expect(result.data).toMatchObject({
        values: { email: validRequest.email },
        message: expect.stringContaining('email jbolanosdiaz@gmail.com')
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('throttles repeated requests from the same client address', async () => {
    const clientAddress = `rate-limit-${Date.now()}`;
    const sendEmail = vi.fn().mockResolvedValue(undefined);
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        processCustomRequest({ values: validRequest, clientAddress, sendEmail })
      )
    );

    expect(results.filter((result) => result.status === 429)).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(3);
  });
});

describe('custom request throttling', () => {
  it('limits three requests per address in a 15-minute window', () => {
    const address = `unit-rate-limit-${Date.now()}`;
    const firstRequestAt = 1_000_000;

    expect(isCustomRequestRateLimited(address, firstRequestAt)).toBe(false);
    expect(isCustomRequestRateLimited(address, firstRequestAt + 1)).toBe(false);
    expect(isCustomRequestRateLimited(address, firstRequestAt + 2)).toBe(false);
    expect(isCustomRequestRateLimited(address, firstRequestAt + 3)).toBe(true);
    expect(isCustomRequestRateLimited(address, firstRequestAt + 15 * 60 * 1000)).toBe(false);
  });
});
