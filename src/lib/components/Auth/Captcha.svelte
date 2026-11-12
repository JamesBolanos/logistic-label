<!-- src/lib/components/Auth/Captcha.svelte -->
<script>
  import { dev } from '$app/env';
  import { PUBLIC_RECAPTCHA_SITE_KEY } from '$app/env/public';
  import { onMount } from 'svelte';

  const RECAPTCHA_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  let {
    siteKey = PUBLIC_RECAPTCHA_SITE_KEY || (dev ? RECAPTCHA_TEST_SITE_KEY : ''),
    onverify = () => {}
  } = $props();

  let captchaLoaded = $state(false);
  let captchaError = $state('');
  let captchaId = $state(null);
  let captchaContainer = $state();
  let scriptElement = null;
  let timeoutId = null;
  let loadAttempt = 0;
  let destroyed = false;

  const SCRIPT_LOAD_TIMEOUT_MS = 12000;

  onMount(() => {
    if (typeof window === 'undefined') return;
    if (siteKey) loadCaptcha();

    return cleanup;
  });

  function cleanup() {
    destroyed = true;
    loadAttempt += 1;
    clearLoadTimeout();
    scriptElement?.remove();
    scriptElement = null;

    if (captchaId !== null && typeof window !== 'undefined' && window.grecaptcha) {
      window.grecaptcha.reset(captchaId);
    }
  }

  function loadCaptcha() {
    const attempt = ++loadAttempt;
    captchaError = '';
    captchaLoaded = false;
    onverify({ verified: false, token: '', error: false });

    if (window.grecaptcha?.render) {
      captchaLoaded = true;
      renderCaptcha();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = 'true';
    scriptElement = script;

    script.onload = () => {
      if (destroyed || attempt !== loadAttempt) return;
      clearLoadTimeout();
      scriptElement = null;

      if (!window.grecaptcha?.render) {
        failCaptchaLoad(attempt);
        return;
      }

      captchaError = '';
      captchaLoaded = true;
      renderCaptcha();
    };
    script.onerror = () => failCaptchaLoad(attempt);

    timeoutId = window.setTimeout(() => failCaptchaLoad(attempt), SCRIPT_LOAD_TIMEOUT_MS);
    document.head.appendChild(script);
  }

  function failCaptchaLoad(attempt) {
    if (destroyed || attempt !== loadAttempt) return;

    clearLoadTimeout();
    scriptElement?.remove();
    scriptElement = null;
    captchaLoaded = false;
    captchaError = 'CAPTCHA could not be loaded. Check your connection and try again.';
    onverify({ verified: false, token: '', error: true });
  }

  function clearLoadTimeout() {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function renderCaptcha() {
    if (
      !captchaLoaded ||
      typeof window === 'undefined' ||
      !window.grecaptcha ||
      !captchaContainer
    ) {
      return;
    }

    if (captchaId !== null) {
      window.grecaptcha.reset(captchaId);
      onverify({ verified: false, token: '', error: false });
      return;
    }

    try {
      captchaId = window.grecaptcha.render(captchaContainer, {
        sitekey: siteKey,
        callback: (token) => onverify({ verified: true, token, error: false }),
        'expired-callback': () => onverify({ verified: false, token: '', error: false })
      });
    } catch {
      captchaLoaded = false;
      captchaError = 'CAPTCHA could not be displayed. Try loading it again.';
      onverify({ verified: false, token: '', error: true });
    }
  }

  function retryCaptcha() {
    if (captchaLoaded && captchaId !== null && window.grecaptcha) {
      window.grecaptcha.reset(captchaId);
      onverify({ verified: false, token: '', error: false });
      return;
    }

    loadCaptcha();
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <span class="text-sm text-muted-foreground">CAPTCHA verification</span>
    {#if captchaLoaded && captchaId !== null}
      <button
        type="button"
        class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
        onclick={retryCaptcha}
        aria-label="Refresh captcha challenge"
      >
        Refresh challenge
      </button>
    {/if}
  </div>

  <div class="rounded-md border border-border-default p-2">
    {#if siteKey}
      <div bind:this={captchaContainer} class="flex justify-center"></div>
      {#if captchaError}
        <div class="mt-2 text-center" role="alert">
          <p class="text-sm text-red-600 dark:text-red-400">{captchaError}</p>
          <button
            type="button"
            class="mt-2 text-sm font-medium text-blue-600 underline dark:text-blue-400"
            onclick={retryCaptcha}
          >
            Try loading CAPTCHA again
          </button>
        </div>
      {/if}
    {:else}
      <p class="text-sm text-red-600 dark:text-red-400 text-center">CAPTCHA is not configured.</p>
    {/if}
    {#if siteKey && !captchaLoaded && !captchaError}
      <p class="mt-2 text-xs text-subtle-foreground text-center" aria-live="polite">
        Loading CAPTCHA verification...
      </p>
    {/if}
  </div>
</div>
