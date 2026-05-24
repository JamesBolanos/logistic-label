<!-- src/lib/components/Auth/LoginForm.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { dev } from '$app/environment';
    import { validateLoginForm } from '$lib/validation/formValidation';
    import Captcha from './Captcha.svelte';
    
    // Allow redirect to a provided return URL (defaults to dashboard)
    export let returnUrl = '/dashboard';
    
    // Form state
    let email = '';
    let password = '';
    let rememberMe = false;
    let isLoading = false;
    let errors = {};
    let formError = '';
    let captchaVerified = false;
    
    // Handle form submission
    async function handleSubmit() {
      // Client-side validation
      const validation = validateLoginForm({ email, password });
      
      if (!validation.isValid) {
        errors = validation.errors;
        return;
      }
      
      // Check if captcha is verified (skip in development)
      if (!dev && !captchaVerified) {
        formError = 'Please complete the captcha verification';
        return;
      }
      
      isLoading = true;
      formError = '';
      errors = {};
      
      try {
        console.log('LoginForm submit start', { email, rememberMe, returnUrl, dev });
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ email, password, rememberMe })
        });
        
        const data = await response.json();
        console.log('LoginForm response', { status: response.status, ok: response.ok, data });
        
        if (!response.ok) {
          formError = data.message || 'Login failed. Please check your credentials.';
          return;
        }
        
        // Successful login
        console.log('LoginForm navigating to returnUrl', returnUrl);
        goto(returnUrl);
      } catch (error) {
        console.error('LoginForm fetch error', error);
        formError = 'An unexpected error occurred. Please try again.';
      } finally {
        // Ensure the button unfreezes even if navigation is blocked
        isLoading = false;
      }
    }
    
    // Handle captcha verification
    function onCaptchaVerify(isVerified) {
      captchaVerified = isVerified;
    }
  </script>
  
  <div class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center">Sign In</h2>
    
    {#if formError}
      <div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        {formError}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <!-- Email Field -->
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
      
      <!-- Password Field -->
      <div>
        <div class="flex justify-between">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <a href="/reset-password" class="text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          id="password"
          bind:value={password}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autocomplete="current-password"
          required
        />
        {#if errors.password}
          <p class="mt-1 text-sm text-red-600">{errors.password}</p>
        {/if}
      </div>
      
      <!-- Remember Me Checkbox -->
      <div class="flex items-center">
        <input
          type="checkbox"
          id="rememberMe"
          bind:checked={rememberMe}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="rememberMe" class="ml-2 block text-sm text-gray-700">
          Remember me
        </label>
      </div>
      
      <!-- Captcha -->
      {#if !dev}
        <div class="my-4">
          <Captcha on:verify={onCaptchaVerify} />
        </div>
      {/if}
      
      <!-- Submit Button -->
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
            Signing in...
          {:else}
            Sign in
          {/if}
        </button>
      </div>
    </form>
    
    {#if dev}
      <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p class="text-sm text-blue-800">
          <strong>Development Mode:</strong> Use test@example.com / password123 to log in.
        </p>
      </div>
    {/if}
    
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <a href="/signup" class="font-medium text-blue-600 hover:text-blue-500">
          Sign up
        </a>
      </p>
    </div>
  </div>