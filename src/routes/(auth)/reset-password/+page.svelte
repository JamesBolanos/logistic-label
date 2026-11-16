<script>
  import { dev } from '$app/env';
  import { page } from '$app/state';
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { trackProductEvent } from '#lib/analytics/client.ts';
  import { authClient } from '#lib/auth-client.js';
  import Captcha from '#lib/components/Auth/Captcha.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import {
    validatePasswordResetForm,
    validatePasswordResetRequest
  } from '#lib/validation/formValidation.js';

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
  let captchaUnavailable = $state(false);

  const CAPTCHA_REQUIRED_MESSAGE = m.auth_captcha_reset_required();
  const CAPTCHA_RETRY_MESSAGE = m.auth_captcha_retry();

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
      formError = captchaUnavailable ? CAPTCHA_RETRY_MESSAGE : CAPTCHA_REQUIRED_MESSAGE;
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
        formError = m.auth_request_could_not_process();
        recordFailure('password_reset_request', 'authentication', startedAt);
        resetCaptcha();
        return;
      }

      requestSent = true;
      trackProductEvent('password_reset_requested');
    } catch {
      formError = '{m.auth_could_not_connect()}';
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
      formError = m.auth_invalid_reset_token();
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
        formError = m.auth_invalid_reset_token();
        recordFailure('password_reset', 'authentication', startedAt);
        return;
      }

      passwordChanged = true;
      newPassword = '';
      confirmPassword = '';
      trackProductEvent('password_reset_succeeded');
    } catch {
      formError = '{m.auth_could_not_connect()}';
      recordFailure('password_reset', 'network', startedAt);
    } finally {
      isLoading = false;
    }
  }

  function onCaptchaVerify({ verified, token: verifiedToken, error }) {
    captchaVerified = verified;
    captchaToken = verifiedToken;
    captchaUnavailable = error;
    if (!error && formError === CAPTCHA_RETRY_MESSAGE) formError = '';
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
  <title>{m.auth_reset_password_title()} - SSCC Labels</title>
  <meta name="description" content={m.auth_reset_password_meta()} />
</svelte:head>

<div class="mx-auto w-full max-w-md rounded-lg bg-surface p-6 shadow-md">
  {#if passwordChanged}
    <h1 class="mb-4 text-center text-2xl font-bold">{m.auth_password_updated()}</h1>
    <div
      class="mb-6 rounded-md border border-green-400 bg-green-100 dark:bg-green-900/40 p-4 text-green-800 dark:text-green-300"
    >
      {m.auth_password_changed_sessions()}
    </div>
    <a
      href={localizeHref('/login')}
      class="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
    >
      {m.auth_sign_in_new_password()}
    </a>
  {:else if token}
    <h1 class="mb-2 text-center text-2xl font-bold">{m.auth_choose_new_password()}</h1>
    <p class="mb-6 text-center text-sm text-muted-foreground">
      {m.auth_password_hint_reset()}
    </p>

    {#if formError}
      <div
        class="mb-6 rounded-md border border-red-400 bg-red-100 dark:bg-red-900/40 p-4 text-red-700 dark:text-red-300"
        role="alert"
      >
        {formError}
      </div>
    {/if}

    <form class="space-y-6" onsubmit={handlePasswordReset}>
      <div>
        <label for="new-password" class="mb-1 block text-sm font-medium text-muted-foreground">
          {m.auth_new_password()}
        </label>
        <input
          id="new-password"
          type="password"
          bind:value={newPassword}
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.newPassword}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
        {/if}
      </div>

      <div>
        <label for="confirm-password" class="mb-1 block text-sm font-medium text-muted-foreground">
          {m.auth_confirm_password_label()}
        </label>
        <input
          id="confirm-password"
          type="password"
          bind:value={confirmPassword}
          autocomplete="new-password"
          minlength="8"
          maxlength="128"
          required
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.confirmPassword}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
        {/if}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? m.auth_updating_password() : m.auth_update_password()}
      </button>
    </form>
  {:else if requestSent}
    <h1 class="mb-4 text-center text-2xl font-bold">{m.auth_check_email()}</h1>
    <div
      class="mb-6 rounded-md border border-green-400 bg-green-100 dark:bg-green-900/40 p-4 text-green-800 dark:text-green-300"
    >
      {m.auth_reset_link_sent()}
    </div>
    <a
      href={localizeHref('/login')}
      class="block text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
    >
      {m.auth_return_sign_in()}
    </a>
  {:else}
    <h1 class="mb-2 text-center text-2xl font-bold">{m.auth_reset_password_heading()}</h1>
    <p class="mb-6 text-center text-sm text-muted-foreground">
      {m.auth_reset_password_desc()}
    </p>

    {#if invalidToken}
      <div
        class="mb-6 rounded-md border border-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 p-4 text-yellow-800 dark:text-yellow-200"
        role="alert"
      >
        {m.auth_invalid_reset_link()}
      </div>
    {/if}

    {#if formError}
      <div
        class="mb-6 rounded-md border border-red-400 bg-red-100 dark:bg-red-900/40 p-4 text-red-700 dark:text-red-300"
        role="alert"
      >
        {formError}
      </div>
    {/if}

    <form class="space-y-6" onsubmit={handleResetRequest}>
      <div>
        <label for="email" class="mb-1 block text-sm font-medium text-muted-foreground">
          {m.auth_email_address_label()}
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          autocomplete="email"
          required
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {#if errors.email}
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
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
        {isLoading ? m.auth_sending_link() : m.auth_send_reset_link()}
      </button>
    </form>

    <div class="mt-6 text-center">
      <a
        href={localizeHref('/login')}
        class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
      >
        {m.auth_return_sign_in()}
      </a>
    </div>
  {/if}
</div>
