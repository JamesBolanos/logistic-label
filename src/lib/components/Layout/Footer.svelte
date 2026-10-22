<script>
  import { page } from '$app/state';

  const footerLinks = [
    { href: '/guide', label: 'Label Guide' },
    { href: '/updates', label: "What's New" },
    { href: '/privacy', label: 'Privacy Policy' },
    {
      href: 'https://github.com/JamesBolanos/print-bridge/releases/latest',
      label: 'Print Bridge',
      external: true
    }
  ];

  let showAdminLink = $derived(Boolean(page.data.isAnalyticsOwner));
</script>

<footer class="border-t border-border-default bg-surface">
  <div class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <div class="max-w-sm">
        <p class="text-sm font-semibold text-foreground">SSCC Labels</p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Free GS1-128 logistic label generation, with a tailored private implementation available
          for custom formats, printers, data, and workflows.
        </p>
      </div>

      <nav aria-label="Footer" class="flex flex-wrap gap-x-6 gap-y-3">
        {#each footerLinks as link (link.href)}
          <a
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            class="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {link.label}
          </a>
        {/each}
        {#if showAdminLink}
          <a
            href="/admin/statistics"
            class="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Statistics
          </a>
        {/if}
      </nav>
    </div>

    <div class="mt-8 border-t border-border-default pt-6">
      <p class="text-sm text-subtle-foreground">
        &copy; {new Date().getFullYear()} GS1-128 Logistic Label Generator. All rights reserved.
      </p>
      <p class="mt-1 text-xs text-subtle-foreground">
        This application complies with GS1 standards for barcode generation. GS1 is a registered
        trademark.
      </p>
    </div>
  </div>
</footer>
