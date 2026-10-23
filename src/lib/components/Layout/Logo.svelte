<script>
  let { href = '/', compact = false } = $props();
</script>

<a
  {href}
  class="inline-flex items-center gap-2.5 rounded-md text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  aria-label="SSCC Labels home"
>
  <span
    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-sm"
  >
    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        d="M3 5.25A1.25 1.25 0 0 1 4.25 4h1.5A1.25 1.25 0 0 1 7 5.25v13.5A1.25 1.25 0 0 1 5.75 20h-1.5A1.25 1.25 0 0 1 3 18.75V5.25ZM9 4h1.5v16H9V4Zm4 1.25A1.25 1.25 0 0 1 14.25 4h1.5A1.25 1.25 0 0 1 17 5.25v13.5A1.25 1.25 0 0 1 15.75 20h-1.5A1.25 1.25 0 0 1 13 18.75V5.25ZM19 4h1.5v16H19V4Z"
      />
    </svg>
  </span>
  <span class="flex min-w-0 flex-col leading-tight">
    <span class="truncate text-sm font-bold tracking-tight">SSCC Labels</span>
    {#if !compact}
      <span class="truncate text-[11px] font-medium text-subtle-foreground">
        GS1-128 logistic labels
      </span>
    {/if}
  </span>
</a>
