<script>
  import { page } from '$app/state';
  import { m } from '#lib/paraglide/messages.js';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';

  let locale = $derived(getLocale());
  let footerLinks = $derived([
    { href: '/guide', label: m.nav_label_guide() },
    { href: '/privacy', label: m.nav_privacy() },
    { href: '/print-bridge', label: m.nav_print_bridge() }
  ]);
  let showAdminLink = $derived(Boolean(page.data.isAnalyticsOwner));
</script>

<footer class="border-t border-border-default bg-surface">
  <div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <div class="max-w-sm">
        <p class="text-sm font-semibold text-foreground">SSCC Labels</p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {m.footer_description()}
        </p>
      </div>

      <nav aria-label={m.nav_footer()} class="flex flex-wrap gap-x-6 gap-y-3">
        {#each footerLinks as link (link.href)}
          <a
            href={localizeHref(link.href, { locale })}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            class="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </a>
        {/each}
        {#if showAdminLink}
          <a
            href={localizeHref('/admin/statistics', { locale })}
            class="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {m.nav_statistics()}
          </a>
        {/if}
      </nav>
    </div>

    <div class="mt-8 border-t border-border-default pt-6">
      <p class="text-sm text-subtle-foreground">
        &copy; {new Date().getFullYear()}
        {m.footer_copyright()}
      </p>
      <p class="mt-1 text-xs text-subtle-foreground">
        {m.footer_gs1_notice()}
      </p>
    </div>
  </div>
</footer>
