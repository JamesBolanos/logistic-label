<script>
  import { toggleTheme } from '#lib/theme/theme.svelte.js';
</script>

<button
  type="button"
  onclick={toggleTheme}
  class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  aria-label="Toggle dark mode"
  title="Toggle dark mode"
>
  <!-- Moon: shown in light mode -->
  <svg
    class="h-5 w-5 dark:hidden"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
    />
  </svg>
  <!-- Sun: shown in dark mode -->
  <svg
    class="hidden h-5 w-5 dark:block"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 3v2.25M12 18.75V21M4.22 4.22l1.59 1.59M18.19 18.19l1.59 1.59M3 12h2.25M18.75 12H21M4.22 19.78l1.59-1.59M18.19 5.81l1.59-1.59"
    />
    <circle cx="12" cy="12" r="4" />
  </svg>
</button>
