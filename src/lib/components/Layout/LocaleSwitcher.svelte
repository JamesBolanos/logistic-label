<script>
  import { m } from '#lib/paraglide/messages.js';
  import { deLocalizeUrl, getLocale, localizeHref, setLocale } from '#lib/paraglide/runtime.js';
  import { page } from '$app/state';

  const options = [
    { locale: 'en', label: 'EN', name: 'English' },
    { locale: 'es', label: 'ES', name: 'Español' }
  ];

  let currentLocale = $derived(getLocale());

  function getHref(locale) {
    if (page.route.id == null) return localizeHref('/', { locale });

    const url = deLocalizeUrl(page.url);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return localizeHref(path, { locale });
  }
</script>

<nav
  aria-label={m.language_switch()}
  class="inline-flex items-center gap-1 rounded-md border border-border-default p-1"
>
  {#each options as option (option.locale)}
    <a
      href={getHref(option.locale)}
      hreflang={option.locale}
      lang={option.locale}
      aria-label={option.name}
      aria-current={currentLocale === option.locale ? 'page' : undefined}
      onclick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        setLocale(option.locale);
        window.location.href = getHref(option.locale);
      }}
      class={`min-w-9 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        currentLocale === option.locale
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
      }`}
    >
      {option.label}
    </a>
  {/each}
</nav>
