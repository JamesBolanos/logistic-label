<script>
  import { dev } from '$app/environment';
  import { page } from '$app/state';
  import { trackProductEvent } from '$lib/analytics/client.js';
  import { authClient } from '$lib/auth-client';
  import Captcha from '$lib/components/Auth/Captcha.svelte';
  import {
    validatePasswordResetForm,
    validatePasswordResetRequest
  } from '$lib/validation/formValidation';

  let token = $derived(page.url.searchParams.get('token'));
  let invalidToken = $derived(page.url.searchParams.get('error') === 'INVALID_TOKEN');

  let email = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let errors = $state({});
  let formError = $state('');
  let requestSent = $state(false);
  let passwordChanged = $state(false);
  let isLoading = $state(false);
  let captchaVerified = $state(false);
  let captchaToken = $state('');
  let captchaKey = $state(0);

  async function handleResetRequest(event) {
    event.preventDefault();
    const startedAt = Date.now();
    const validation = validatePasswordResetRequest({ email: email.trim() });

    if (!validation.isValid) {
      errors = validation.errors;
      recordFailure('password_reset_request', 'validation', startedAt);
      return;
    }

    if (!dev && !captchaVerified) {
      formError = 'Please complete the captcha verification';
      recordFailure('password_reset_request', 'validation', startedAt);
      return;
    }

    isLoading = true;
    errors = {};
    formError = '';

    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken
      });

      if (error) {
        formError = 'We could not process the request. Please try again.';
        recordFailure('password_reset_request', 'authentication', startedAt);
        resetCaptcha();
        return;
      }

      requestSent = true;
      trackProductEvent('password_reset_requested');
    } catch {
      formError = 'We could not connect to the service. Please try again.';
      recordFailure('password_reset_request', 'network', startedAt);
      resetCaptcha();
    } finally {
      isLoading = false;
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    const startedAt = Date.now();
    const validation = validatePasswordResetForm({ newPassword, confirmPassword });

    if (!validation.isValid) {
      errors = validation.errors;
      recordFailure('password_reset', 'validation', startedAt);
      return;
    }

    if (!token) {
      formError = 'This password reset link is invalid or has expired.';
      return;
    }

    isLoading = true;
    errors = {};
    formError = '';

    try {
      const { error } = await authClient.resetPassword({
        newPassword,
        token
      });

      if (error) {
        formError = 'This password reset link is invalid or has expired.';
        recordFailure('password_reset', 'authentication', startedAt);
        return;
      }

      passwordChanged = true;
      newPassword = '';
      confirmPassword = '';
      trackProductEvent('password_reset_succeeded');
    } catch {
      formError = 'We could not connect to the service. Please try again.';
      recordFailure('password_reset', 'network', startedAt);
    } finally {
      isLoading = false;
    }
  }

  function onCaptchaVerify({ verified, token: verifiedToken }) {
    captchaVerified = verified;
    captchaToken = verifiedToken;
  }

  function resetCaptcha() {
    captchaVerified = false;
    captchaToken = '';
    captchaKey += 1;
  }

  function recordFailure(step, errorCategory, startedAt) {
    trackProductEvent('workflow_failed', {
      step,
      error_category: errorCategory,
      duration_ms: Date.now() - startedAt
    });
  }
</script>

<svelte:head>
  <title>Reset Password - SSCC Labels</title>
  <meta
    name="description"
    content="Request a secure password reset link for your SSCC Labels account."
  />
</svelte:head>

<div class="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-md">
  {#if passwordChanged}
    <h1 class="mb-4 text-center text-2xl font-bold">Password updated</h1>
    <div class="mb-6 rounded-md border border-green-400 bg-green-100 p-4 text-green-800">
      Your password has been changed. For your security, existing sessions have been signed out.
    </div>
    <a
      href="/login"
      class="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
    >
      Sign in with your new password
    </a>
  {:else if token}
    <h1 class="mb-2 text-center text-2xl font-bold">Choose a new password</h1>
    <p class="mb-6 text-center text-sm text-gray-600">
      Use at least 8 characters with uppercase, lowercase, and numbers.
    </p>

    {#if formError}
      <div class="mb-6 rounded-md border border-red-400 bg-red-100 p-4 text-red-700" role="alert">
        {formError}
      </div>
    {/if}

    <form class="space-y-6" onsubmit={handlePasswordReset}>
      <div>
        <label for="new-password" class="mb-1 block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          bind:value={newPassword}
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.newPassword}
          <p class="mt-1 text-sm text-red-600">{errors.newPassword}</p>
        {/if}
      </div>

      <div>
        <label for="confirm-password" class="mb-1 block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          bind:value={confirmPassword}
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.confirmPassword}
          <p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
        {/if}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Updating password...' : 'Update password'}
      </button>
    </form>
  {:else if requestSent}
    <h1 class="mb-4 text-center text-2xl font-bold">Check your email</h1>
    <div class="mb-6 rounded-md border border-green-400 bg-green-100 p-4 text-green-800">
      If an account exists for that address, we sent a password reset link. The link expires in 60
      minutes.
    </div>
    <a
      href="/login"
      class="block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
    >
      Return to sign in
    </a>
  {:else}
    <h1 class="mb-2 text-center text-2xl font-bold">Reset your password</h1>
    <p class="mb-6 text-center text-sm text-gray-600">
      Enter your email address and we will send a reset link if an account exists.
    </p>

    {#if invalidToken}
      <div
        class="mb-6 rounded-md border border-yellow-400 bg-yellow-100 p-4 text-yellow-800"
        role="alert"
      >
        That password reset link is invalid or has expired. Request a new link below.
      </div>
    {/if}

    {#if formError}
      <div class="mb-6 rounded-md border border-red-400 bg-red-100 p-4 text-red-700" role="alert">
        {formError}
      </div>
    {/if}

    <form class="space-y-6" onsubmit={handleResetRequest}>
      <div>
        <label for="email" class="mb-1 block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          autocomplete="email"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.email}
          <p class="mt-1 text-sm text-red-600">{errors.email}</p>
        {/if}
      </div>

      {#if !dev}
        {#key captchaKey}
          <Captcha onverify={onCaptchaVerify} />
        {/key}
      {/if}

      <button
        type="submit"
        disabled={isLoading}
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Sending link...' : 'Send reset link'}
      </button>
    </form>

    <div class="mt-6 text-center">
      <a href="/login" class="text-sm font-medium text-blue-600 hover:text-blue-500">
        Return to sign in
      </a>
    </div>
  {/if}
</div>
