<!-- Sign-in, sign-up, and password recovery pages. -->
<script>
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import LocaleSwitcher from '#lib/components/Layout/LocaleSwitcher.svelte';
  import Logo from '#lib/components/Layout/Logo.svelte';
  import ThemeToggle from '#lib/components/Layout/ThemeToggle.svelte';

  let { children } = $props();
  let locale = $derived(getLocale());
</script>

<div class="flex min-h-screen flex-col bg-background">
  <header class="border-b border-border-default bg-surface">
    <div
      class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
    >
      <Logo />
      <div class="flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <a
          href={localizeHref('/', { locale })}
          class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        >
          {m.nav_back_to_site()}
        </a>
      </div>
    </div>
  </header>

  <main class="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
    <div class="w-full max-w-md">{@render children()}</div>
  </main>

  <footer class="border-t border-border-default bg-surface">
    <div
      class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-subtle-foreground sm:px-6 lg:px-8"
    >
      <p>&copy; {new Date().getFullYear()} SSCC Labels</p>
      <a href={localizeHref('/privacy', { locale })} class="font-medium hover:text-foreground"
        >{m.nav_privacy()}</a
      >
    </div>
  </footer>
</div>
