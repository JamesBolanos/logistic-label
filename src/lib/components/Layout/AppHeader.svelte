<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { authClient } from '#lib/auth-client.js';
  import { m } from '#lib/paraglide/messages.js';
  import { deLocalizeUrl, getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import LocaleSwitcher from './LocaleSwitcher.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  let { user = null, ontogglemenu = () => {} } = $props();

  const pageTitles = {
    '/dashboard': m.nav_dashboard,
    '/labels': m.nav_label_generator,
    '/labels/history': m.nav_saved_labels,
    '/products': m.nav_products,
    '/printer': m.nav_printer_config,
    '/settings': m.nav_settings,
    '/export': m.nav_data_export,
    '/admin/statistics': m.nav_statistics
  };

  let locale = $derived(getLocale());
  let canonicalPath = $derived(deLocalizeUrl(page.url).pathname);
  let displayName = $derived(user?.displayName || m.nav_user());
  let email = $derived(user?.email || '');
  let pageTitle = $derived(
    (
      pageTitles[canonicalPath] ??
      (canonicalPath.startsWith('/labels/create') ? m.nav_label_generator : () => m.nav_workspace())
    )()
  );
  let isLoggingOut = $state(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
      await authClient.signOut();
      await goto(localizeHref('/login', { locale }), { refreshAll: true });
    } catch (error) {
      console.error('Logout error:', error);
      isLoggingOut = false;
    }
  }
</script>

<header class="sticky top-0 z-30 border-b border-border-default bg-surface">
  <div class="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        onclick={ontogglemenu}
        class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label={m.nav_open_menu()}
        aria-controls="app-sidebar"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <p class="truncate text-sm font-semibold text-foreground">{pageTitle}</p>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <LocaleSwitcher />
      <ThemeToggle />

      <div class="hidden text-right sm:block">
        <p class="max-w-[12rem] truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p class="max-w-[12rem] truncate text-xs text-subtle-foreground">{email}</p>
      </div>

      <button
        type="button"
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="inline-flex items-center justify-center rounded-md border border-border-default bg-surface px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {isLoggingOut ? m.auth_signing_out() : m.nav_logout()}
      </button>
    </div>
  </div>
</header>
