<!-- src/routes/signup/+page.svelte -->
<script>
  import { page } from '$app/state';
  import SignupForm from '#lib/components/Auth/SignupForm.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { getGoogleAuthErrorMessage } from '#lib/auth/googleAuthErrors.ts';

  let googleAuthError = $derived(getGoogleAuthErrorMessage(page.url.searchParams.get('error')));
</script>

<svelte:head>
  <title>{m.auth_create_account_page_title()} - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Create a new account to generate GS1-128 compliant logistic labels."
  />
</svelte:head>

<div class="max-w-md mx-auto">
  <h1 class="text-2xl font-bold text-center text-foreground mb-8">
    {m.auth_create_account_title()}
  </h1>

  <SignupForm initialError={googleAuthError} />
</div>
