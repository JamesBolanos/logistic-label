<!-- src/lib/components/Auth/Captcha.svelte -->
<script>
  import { dev } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';

  const RECAPTCHA_TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  let {
    siteKey = env.PUBLIC_RECAPTCHA_SITE_KEY || (dev ? RECAPTCHA_TEST_SITE_KEY : ''),
    onverify = () => {}
  } = $props();

  let captchaLoaded = $state(false);
  let captchaId = null;
  let captchaContainer = $state();

  onMount(() => {
    if (typeof window === 'undefined') return;
    if (!siteKey) return;

    if (window.grecaptcha) {
      captchaLoaded = true;
      renderCaptcha();
      return cleanup;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      captchaLoaded = true;
      renderCaptcha();
    };
    document.head.appendChild(script);

    return cleanup;
  });

  function cleanup() {
    if (captchaId !== null && typeof window !== 'undefined' && window.grecaptcha) {
      window.grecaptcha.reset(captchaId);
    }
  }

  function renderCaptcha() {
    if (!captchaLoaded || typeof window === 'undefined' || !window.grecaptcha || !captchaContainer) {
      return;
    }

    // Reset an existing widget before re-rendering
    if (captchaId !== null) {
      window.grecaptcha.reset(captchaId);
      onverify({ verified: false, token: '' });
    }

    captchaId = window.grecaptcha.render(captchaContainer, {
      sitekey: siteKey,
      callback: (token) => onverify({ verified: true, token }),
      'expired-callback': () => onverify({ verified: false, token: '' })
    });
  }

  function refreshCaptcha() {
    renderCaptcha();
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <span class="text-sm text-gray-700">Captcha verification</span>
    <button
      type="button"
      class="text-sm text-blue-600 hover:text-blue-500"
      onclick={refreshCaptcha}
      aria-label="Refresh captcha"
    >
      Refresh
    </button>
  </div>

  <div class="rounded-md border border-gray-200 p-2">
    {#if siteKey}
      <div bind:this={captchaContainer} class="flex justify-center"></div>
    {:else}
      <p class="text-sm text-red-600 text-center">Captcha is not configured.</p>
    {/if}
    {#if siteKey && !captchaLoaded}
      <p class="mt-2 text-xs text-gray-500 text-center">Loading captcha...</p>
    {/if}
  </div>
</div>
