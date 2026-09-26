# Password Recovery Runbook

## Purpose

Password recovery uses Better Auth for one-time reset tokens, reCAPTCHA for request protection, Resend for transactional email, and Vercel `waitUntil` for reliable background delivery.

The browser always receives the same request confirmation whether an account exists. Reset links expire after 60 minutes, can be used once, and revoke the user's existing sessions after a successful password change.

## One-time provider setup

1. Create a Resend account and add the sending domain `auth.sscc-labels.com`.
2. Copy the DNS records shown by Resend into the Squarespace DNS manager exactly as provided. Resend supplies the record types, names, and values.
3. Wait until Resend reports the domain as verified.
4. Create a Resend API key. Use separate nonproduction and production keys when the account supports that separation; otherwise, use the same key in Vercel and control its availability through the Preview and Production scopes. Grant only email-sending access and restrict the key to the verified domain when that option is available.

The application sender is:

```text
SSCC Labels <noreply@auth.sscc-labels.com>
```

Using a sending subdomain keeps authentication-email configuration separate from the website and ordinary mailbox DNS.

## Vercel environment variables

Add the same variable names with environment-specific values:

| Variable          | Vercel type |            Preview |         Production |
| ----------------- | ----------- | -----------------: | -----------------: |
| `RESEND_API_KEY`  | Secret      |     Resend API key |     Resend API key |
| `AUTH_EMAIL_FROM` | Config      | Sender shown above | Sender shown above |

The same Resend API key may be used in both Vercel scopes when the Resend account does not provide environment-specific keys. Keep it out of local files, screenshots, logs, issues, and commits. After adding or changing the variables, redeploy the affected environment because an existing deployment does not receive new values automatically.

Production startup treats both variables as required. This prevents deploying a password-reset page that cannot deliver its email.

## Staging acceptance check

Use an owner-controlled email-and-password test account. Do not use another user's address.

1. Open `/login`, choose **Forgot password?**, and confirm `/reset-password` loads.
2. Enter the test account email, complete reCAPTCHA, and submit.
3. Confirm the page says that an email was sent _if an account exists_.
4. Confirm Resend records a successful delivery and the message arrives from the configured sender.
5. Open the message link and set a different strong password.
6. Confirm the new password signs in and the old password does not.
7. Open the same email link again and confirm it is rejected as invalid or expired.
8. In another active browser session, confirm the reset signed that session out.
9. Repeat the request with an unused address and confirm the page shows the same generic response while Resend sends no message.

Do not paste a reset URL into tickets or logs. It contains a temporary credential.

## Operational checks

- A user reports no email: check Resend delivery status, spam filtering, the verified domain, and the two Vercel variables. Do not confirm whether the address has an account.
- Vercel logs a provider rejection: verify that the Resend domain and all of its DNS records show `verified`, the API key belongs to that Resend account, and `AUTH_EMAIL_FROM` follows `Name <email@verified-domain>` or `email@verified-domain` format.
- Every link is rejected: confirm `BETTER_AUTH_URL` matches the deployment origin and that the link is less than 60 minutes old.
- reCAPTCHA blocks every request: verify the site and secret keys belong to the deployment domain.

The implementation is in:

- `src/routes/reset-password/+page.svelte`
- `src/lib/server/auth/betterAuth.js`
- `src/lib/server/email/passwordReset.js`
- `src/hooks.server.js`
