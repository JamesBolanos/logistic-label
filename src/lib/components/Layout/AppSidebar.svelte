<script>
  import { page } from '$app/state';
  import Logo from './Logo.svelte';

  let { user = null, isAnalyticsOwner = false, mobileOpen = false, onclose = () => {} } = $props();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/labels', label: 'Label Generator', icon: 'generator' },
    { href: '/labels/history', label: 'Saved Labels', icon: 'saved' },
    { href: '/products', label: 'Products', icon: 'products' },
    { href: '/printer', label: 'Printer Config', icon: 'printer' },
    { href: '/settings', label: 'Settings', icon: 'settings' }
  ];

  let visibleNavItems = $derived(
    isAnalyticsOwner
      ? [
          ...navItems.slice(0, 2),
          { href: '/admin/statistics', label: 'Statistics', icon: 'statistics' },
          ...navItems.slice(2)
        ]
      : navItems
  );

  let displayName = $derived(user?.displayName || 'User');
  let email = $derived(user?.email || '');
  let initials = $derived(getInitials(displayName));

  function getInitials(name) {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) return 'U';
    return parts.map((part) => part[0].toUpperCase()).join('');
  }

  function isActive(href) {
    const path = page.url.pathname;

    if (href === '/dashboard') return path === '/dashboard';
    if (href === '/labels') return path === '/labels' || path.startsWith('/labels/create');
    if (href === '/labels/history') return path.startsWith('/labels/history');
    if (href === '/products') return path === '/products' || path.startsWith('/products/');
    if (href === '/printer') return path === '/printer' || path.startsWith('/printer/');
    if (href === '/settings') return path === '/settings' || path.startsWith('/settings/');
    if (href === '/admin/statistics') return path.startsWith('/admin/statistics');
    return path === href;
  }

  function itemClass(href) {
    return isActive(href)
      ? 'flex items-center gap-3 rounded-lg bg-accent/10 px-3 py-2.5 text-sm font-semibold text-accent'
      : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground';
  }
</script>

{#if mobileOpen}
  <button
    type="button"
    class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
    onclick={onclose}
    aria-label="Close navigation overlay"
  ></button>
{/if}

<aside
  id="app-sidebar"
  class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-out lg:translate-x-0 {mobileOpen
    ? 'translate-x-0'
    : '-translate-x-full'}"
  aria-label="Application sidebar"
>
  <div class="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
    <Logo />
    <button
      type="button"
      onclick={onclose}
      class="inline-flex h-9 w-9 items-center justify-center rounded-md text-subtle-foreground hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      aria-label="Close navigation"
    >
      <svg
        class="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <nav aria-label="Application" class="flex-1 overflow-y-auto px-3 py-4">
    <p class="px-3 pb-2 text-[11px] font-semibold tracking-wider text-subtle-foreground uppercase">
      Workspace
    </p>

    <div class="space-y-1">
      {#each visibleNavItems as item (item.href)}
        <a
          href={item.href}
          class={itemClass(item.href)}
          aria-current={isActive(item.href) ? 'page' : undefined}
          onclick={onclose}
        >
          {#if item.icon === 'dashboard'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 10.5 12 3l9 7.5M5.25 9.75V21h13.5V9.75M9.75 21v-6h4.5v6"
              />
            </svg>
          {:else if item.icon === 'generator'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 5v14M5 12h14M4 4h16v16H4z"
              />
            </svg>
          {:else if item.icon === 'saved'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 3.75h12a1.5 1.5 0 0 1 1.5 1.5V21l-7.5-4.5L4.5 21V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
              />
            </svg>
          {:else if item.icon === 'products'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25 12 3 3 8.25m18 0-9 5.25m9-5.25V15.75L12 21m0-12.75L3 8.25m9 5.25V21M3 8.25V15.75L12 21"
              />
            </svg>
          {:else if item.icon === 'printer'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 9V3.75h10.5V9M6.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-4.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v4.5A2.25 2.25 0 0 1 18.75 18h-1.5M6.75 14.25h10.5v6H6.75z"
              />
            </svg>
          {:else if item.icon === 'statistics'}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 20V10m5 10V4m5 16v-7m5 7V7"
              />
            </svg>
          {:else}
            <svg
              class="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.48.6.87.63H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
              />
            </svg>
          {/if}
          <span class="truncate">{item.label}</span>
        </a>
      {/each}
    </div>

    <div class="mt-8 border-t border-sidebar-border pt-4">
      <a
        href="/guide"
        onclick={onclose}
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <svg
          class="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.25c-1.5-1.5-3.5-2-6-2v13.5c2.5 0 4.5.5 6 2m0-13.5c1.5-1.5 3.5-2 6-2v13.5c-2.5 0-4.5.5-6 2m0-13.5v13.5"
          />
        </svg>
        <span class="truncate">Label Guide</span>
      </a>
    </div>
  </nav>

  <div class="shrink-0 border-t border-sidebar-border p-4">
    <div class="flex items-center gap-3 rounded-lg bg-surface-muted p-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
        aria-hidden="true"
      >
        {initials}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p class="truncate text-xs text-subtle-foreground">{email}</p>
      </div>
    </div>
  </div>
</aside>
