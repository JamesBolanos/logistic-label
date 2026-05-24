<!-- src/lib/components/Auth/Captcha.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let siteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google reCAPTCHA test key for development

  let captchaLoaded = false;
  let captchaId = null;
  let captchaContainer;

  onMount(() => {
    if (typeof window === 'undefined') return;

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
      dispatch('verify', false);
    }

    captchaId = window.grecaptcha.render(captchaContainer, {
      sitekey: siteKey,
      callback: () => dispatch('verify', true),
      'expired-callback': () => dispatch('verify', false)
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
      on:click={refreshCaptcha}
      aria-label="Refresh captcha"
    >
      Refresh
    </button>
  </div>

  <div class="rounded-md border border-gray-200 p-2">
    <div bind:this={captchaContainer} class="flex justify-center"></div>
    {#if !captchaLoaded}
      <p class="mt-2 text-xs text-gray-500 text-center">Loading captcha...</p>
    {/if}
  </div>
</div>