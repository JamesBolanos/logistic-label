<script>
  import { page } from '$app/state';
  import { m } from '#lib/paraglide/messages.js';
  import { deLocalizeUrl, getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import LocaleSwitcher from './LocaleSwitcher.svelte';
  import Logo from './Logo.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  let { user = null } = $props();
  let isMobileMenuOpen = $state(false);

  let publicLinks = $derived([
    { href: '/', label: m.nav_home() },
    { href: '/guide', label: m.nav_label_guide() }
  ]);
  let locale = $derived(getLocale());
  let isLoggedIn = $derived(Boolean(user));

  function localize(path) {
    return localizeHref(path, { locale });
  }

  function isActive(href) {
    const path = deLocalizeUrl(page.url).pathname;
    if (href === '/') return path === '/';
    return path === href || path.startsWith(`${href}/`);
  }

  function linkClass(href, mobile = false) {
    const active = isActive(href);

    if (mobile) {
      return active
        ? 'block rounded-md bg-accent/10 px-3 py-2 text-sm font-semibold text-accent'
        : 'block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground';
    }

    return active
      ? 'rounded-md bg-accent/10 px-3 py-2 text-sm font-semibold text-accent'
      : 'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground';
  }
</script>

<header class="sticky top-0 z-40 border-b border-border-default bg-surface">
  <div
    class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
  >
    <div class="flex min-w-0 items-center gap-8">
      <Logo />

      <nav aria-label={m.nav_main()} class="hidden items-center gap-1 md:flex">
        {#each publicLinks as link (link.href)}
          <a
            href={localize(link.href)}
            class={linkClass(link.href)}
            aria-current={isActive(link.href) ? 'page' : undefined}
          >
            {link.label}
          </a>
        {/each}
      </nav>
    </div>

    <div class="flex items-center gap-2">
      <LocaleSwitcher />
      <ThemeToggle />

      {#if isLoggedIn}
        <a
          href={localize('/dashboard')}
          class="hidden rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
        >
          {m.nav_open_app()}
        </a>
      {:else}
        <a
          href={localize('/login')}
          class="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground sm:inline-flex"
        >
          {m.nav_login()}
        </a>
        <a
          href={localize('/signup')}
          class="hidden rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
        >
          {m.nav_signup()}
        </a>
      {/if}

      <button
        type="button"
        onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
        class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
        aria-expanded={isMobileMenuOpen}
        aria-controls="public-mobile-menu"
        aria-label={isMobileMenuOpen ? m.nav_close_menu() : m.nav_open_menu()}
      >
        {#if isMobileMenuOpen}
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
        {:else}
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
        {/if}
      </button>
    </div>
  </div>

  {#if isMobileMenuOpen}
    <div id="public-mobile-menu" class="border-t border-border-default bg-surface md:hidden">
      <nav aria-label={m.nav_mobile()} class="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
        {#each publicLinks as link (link.href)}
          <a href={localize(link.href)} class={linkClass(link.href, true)}>
            {link.label}
          </a>
        {/each}

        <div class="mt-4 flex flex-col gap-2 border-t border-border-default pt-4">
          {#if isLoggedIn}
            <a
              href={localize('/dashboard')}
              class="rounded-md bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              {m.nav_open_app()}
            </a>
          {:else}
            <a
              href={localize('/login')}
              class="rounded-md border border-border-default px-4 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-surface-muted"
            >
              {m.nav_login()}
            </a>
            <a
              href={localize('/signup')}
              class="rounded-md bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            >
              {m.nav_signup()}
            </a>
          {/if}
        </div>
      </nav>
    </div>
  {/if}
</header>
