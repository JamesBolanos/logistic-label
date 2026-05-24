<!-- src/lib/components/Auth/SignupForm.svelte -->
<script>
  import { goto } from '$app/navigation';
  import { dev } from '$app/environment';
  import { validateRegistrationForm } from '$lib/validation/formValidation';
  import Captcha from './Captcha.svelte';

  let email = '';
  let username = '';
  let full_name = '';
  let password = '';
  let password_confirm = '';
  let isLoading = false;
  let errors = {};
  let formError = '';
  let formSuccess = '';
  let captchaVerified = false;

  async function handleSubmit() {
    const validation = validateRegistrationForm({ 
      email, 
      username, 
      full_name, 
      password, 
      password_confirm 
    });

    if (!validation.isValid) {
      errors = validation.errors;
      return;
    }

    if (!dev && !captchaVerified) {
      formError = 'Please complete the captcha verification';
      return;
    }

    isLoading = true;
    formError = '';
    formSuccess = '';
    errors = {};

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          username,
          full_name,
          password,
          password_confirm
        })
      });

      const data = await response.json();

      if (!response.ok) {
        formError = data.message || 'Registration failed. Please try again.';
        if (data.errors) {
          errors = data.errors;
        }
        isLoading = false;
        return;
      }

      formSuccess = 'Account created successfully! Redirecting to login...';
      setTimeout(() => goto('/login'), 2000);
    } catch (error) {
      formError = 'An unexpected error occurred. Please try again.';
      isLoading = false;
    }
  }

  function onCaptchaVerify(isVerified) {
    captchaVerified = isVerified;
  }
</script>

<div class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
  <h2 class="text-2xl font-bold mb-6 text-center">Create an Account</h2>

  {#if formError}
    <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
      {formError}
    </div>
  {/if}

  {#if formSuccess}
    <div class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
      {formSuccess}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
        Email Address
      </label>
      <input
        type="email"
        id="email"
        bind:value={email}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autocomplete="email"
        required
      />
      {#if errors.email}
        <p class="mt-1 text-sm text-red-600">{errors.email}</p>
      {/if}
    </div>

    <div>
      <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
        Username
      </label>
      <input
        type="text"
        id="username"
        bind:value={username}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autocomplete="username"
        required
      />
      {#if errors.username}
        <p class="mt-1 text-sm text-red-600">{errors.username}</p>
      {/if}
    </div>

    <div>
      <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">
        Full Name
      </label>
      <input
        type="text"
        id="full_name"
        bind:value={full_name}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autocomplete="name"
        required
      />
      {#if errors.full_name}
        <p class="mt-1 text-sm text-red-600">{errors.full_name}</p>
      {/if}
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
        Password
      </label>
      <input
        type="password"
        id="password"
        bind:value={password}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autocomplete="new-password"
        required
      />
      {#if errors.password}
        <p class="mt-1 text-sm text-red-600">{errors.password}</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        Password must be at least 8 characters and include uppercase, lowercase, and numbers.
      </p>
    </div>

    <div>
      <label for="password_confirm" class="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password
      </label>
      <input
        type="password"
        id="password_confirm"
        bind:value={password_confirm}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        autocomplete="new-password"
        required
      />
      {#if errors.password_confirm}
        <p class="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
      {/if}
    </div>

    {#if !dev}
      <div class="my-4">
        <Captcha on:verify={onCaptchaVerify} />
      </div>
    {/if}

    <div>
      <button
        type="submit"
        disabled={isLoading}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {#if isLoading}
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating account...
        {:else}
          Create Account
        {/if}
      </button>
    </div>
  </form>

  <div class="mt-6 text-center">
    <p class="text-sm text-gray-600">
      Already have an account?
      <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
        Sign in
      </a>
    </p>
  </div>
</div>
