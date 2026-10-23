<script>
  import { authClient } from '#lib/auth-client.js';

  let { user = null } = $props();

  // Display name
  let displayName = $state(user?.name || '');
  let nameSaving = $state(false);
  let nameError = $state('');
  let nameMessage = $state('');

  // Password change
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordSaving = $state(false);
  let passwordError = $state('');
  let passwordMessage = $state('');

  async function saveDisplayName(event) {
    event.preventDefault();
    if (nameSaving) return;

    nameSaving = true;
    nameError = '';
    nameMessage = '';

    try {
      const { error } = await authClient.updateUser({ name: displayName.trim() });

      if (error) {
        nameError = error.message || 'Failed to update your profile.';
        return;
      }

      nameMessage = 'Profile updated.';
    } catch {
      nameError = 'We could not connect to the service. Please try again.';
    } finally {
      nameSaving = false;
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwordSaving) return;

    passwordError = '';
    passwordMessage = '';

    if (newPassword !== confirmPassword) {
      passwordError = 'The new passwords do not match.';
      return;
    }

    passwordSaving = true;

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      });

      if (error) {
        passwordError = error.message || 'Failed to change your password.';
        return;
      }

      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      passwordMessage = 'Password changed. Other sessions were signed out.';
    } catch {
      passwordError = 'We could not connect to the service. Please try again.';
    } finally {
      passwordSaving = false;
    }
  }
</script>

<section
  aria-labelledby="account-heading"
  class="space-y-6 rounded-lg border border-border-default bg-surface p-6 shadow"
>
  <div>
    <h2 id="account-heading" class="text-xl font-semibold text-foreground">Account</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Your account email and display name are shown in the header and sidebar.
    </p>
  </div>

  <div>
    <label for="account_email" class="mb-1 block text-sm font-medium text-muted-foreground">
      Email Address
    </label>
    <input
      id="account_email"
      type="email"
      value={user?.email || ''}
      readonly
      class="w-full rounded-md border border-border-default bg-surface-muted px-3 py-2 text-muted-foreground"
    />
  </div>

  <form
    onsubmit={saveDisplayName}
    class="space-y-4 border-t border-border-default pt-6"
    aria-label="Display name"
  >
    <div>
      <label for="account_display_name" class="mb-1 block text-sm font-medium text-muted-foreground">
        Display Name
      </label>
      <input
        id="account_display_name"
        type="text"
        bind:value={displayName}
        maxlength="120"
        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {#if nameError}<p class="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {nameError}
        </p>{/if}
      {#if nameMessage}<p class="mt-1 text-sm text-green-700 dark:text-green-300" role="status">
          {nameMessage}
        </p>{/if}
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        disabled={nameSaving}
        class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
      >
        {nameSaving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  </form>

  <form
    onsubmit={changePassword}
    class="space-y-4 border-t border-border-default pt-6"
    aria-label="Change password"
  >
    <div>
      <h3 class="text-base font-semibold text-foreground">Change password</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Changing your password signs out your other sessions.
      </p>
    </div>

    <div>
      <label
        for="account_current_password"
        class="mb-1 block text-sm font-medium text-muted-foreground"
      >
        Current Password
      </label>
      <input
        id="account_current_password"
        type="password"
        autocomplete="current-password"
        bind:value={currentPassword}
        required
        class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label
          for="account_new_password"
          class="mb-1 block text-sm font-medium text-muted-foreground"
        >
          New Password
        </label>
        <input
          id="account_new_password"
          type="password"
          autocomplete="new-password"
          bind:value={newPassword}
          minlength="8"
          required
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          for="account_confirm_password"
          class="mb-1 block text-sm font-medium text-muted-foreground"
        >
          Confirm New Password
        </label>
        <input
          id="account_confirm_password"
          type="password"
          autocomplete="new-password"
          bind:value={confirmPassword}
          minlength="8"
          required
          class="w-full rounded-md border border-border-strong px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {#if passwordError}
      <p class="text-sm text-red-600 dark:text-red-400" role="alert">{passwordError}</p>
    {/if}
    {#if passwordMessage}
      <p class="text-sm text-green-700 dark:text-green-300" role="status">{passwordMessage}</p>
    {/if}

    <div class="flex justify-end">
      <button
        type="submit"
        disabled={passwordSaving}
        class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
      >
        {passwordSaving ? 'Updating...' : 'Change Password'}
      </button>
    </div>
  </form>
</section>
