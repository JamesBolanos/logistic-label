<script>
  import { authClient } from '#lib/auth-client.js';
  import { m } from '#lib/paraglide/messages.js';

  let { user = null } = $props();

  // Display name
  // svelte-ignore state_referenced_locally
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
        nameError = error.message || m.account_failed_profile();
        return;
      }

      nameMessage = m.account_profile_updated();
    } catch {
      nameError = m.account_could_not_connect();
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
      passwordError = m.account_password_mismatch();
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
        passwordError = error.message || m.account_failed_password();
        return;
      }

      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      passwordMessage = m.account_password_changed();
    } catch {
      passwordError = m.account_could_not_connect();
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
    <h2 id="account-heading" class="text-xl font-semibold text-foreground">{m.account_title()}</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      {m.account_desc()}
    </p>
  </div>

  <div>
    <label for="account_email" class="mb-1 block text-sm font-medium text-muted-foreground">
      {m.account_email_address()}
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
    aria-label={m.account_display_name_aria()}
  >
    <div>
      <label
        for="account_display_name"
        class="mb-1 block text-sm font-medium text-muted-foreground"
      >
        {m.account_display_name()}
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
        {nameSaving ? m.account_saving() : m.account_save_profile()}
      </button>
    </div>
  </form>

  <form
    onsubmit={changePassword}
    class="space-y-4 border-t border-border-default pt-6"
    aria-label={m.account_change_password_aria()}
  >
    <div>
      <h3 class="text-base font-semibold text-foreground">{m.account_change_password()}</h3>
      <p class="mt-1 text-sm text-muted-foreground">
        {m.account_change_password_desc()}
      </p>
    </div>

    <div>
      <label
        for="account_current_password"
        class="mb-1 block text-sm font-medium text-muted-foreground"
      >
        {m.account_current_password()}
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
        {passwordSaving ? m.account_updating() : m.account_change_password_button()}
      </button>
    </div>
  </form>
</section>
