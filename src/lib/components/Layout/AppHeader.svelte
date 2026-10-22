<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { authClient } from '#lib/auth-client.js';
  import ThemeToggle from './ThemeToggle.svelte';

  let { user = null, ontogglemenu = () => {} } = $props();

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/labels': 'Label Generator',
    '/labels/history': 'Saved Labels',
    '/products': 'Products',
    '/printer': 'Printer Config',
    '/settings': 'Settings',
    '/admin/statistics': 'Statistics'
  };

  let displayName = $derived(user?.displayName || 'User');
  let email = $derived(user?.email || '');
  let pageTitle = $derived(
    pageTitles[page.url.pathname] ??
      (page.url.pathname.startsWith('/labels/create') ? 'Label Generator' : 'Workspace')
  );
  let isLoggingOut = $state(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;

    try {
      await authClient.signOut();
      await goto('/login', { refreshAll: true });
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
        aria-label="Open navigation"
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
        {isLoggingOut ? 'Signing out...' : 'Logout'}
      </button>
    </div>
  </div>
</header>
