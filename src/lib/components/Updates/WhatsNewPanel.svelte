<script>
  import { formatReleaseDate } from '#lib/content/releases.ts';
  import { observeReleaseUpdate, trackProductEvent } from '#lib/analytics/client.ts';

  let { updates = [] } = $props();

  function categoryClass(category) {
    if (category === 'fix')
      return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-red-600/20';
    if (category === 'improvement')
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-600/20';
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-blue-600/20';
  }
</script>

<section
  aria-labelledby="whats-new-heading"
  class="overflow-hidden rounded-lg border border-blue-100 dark:border-blue-900 bg-surface shadow"
>
  <div
    class="flex flex-col gap-3 border-b border-border-default px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
  >
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        Product updates
      </p>
      <h2 id="whats-new-heading" class="mt-1 text-lg font-semibold text-foreground">What's new</h2>
    </div>
    <a
      class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
      href="/updates"
    >
      View all updates
    </a>
  </div>

  {#if updates.length === 0}
    <p class="px-4 py-6 text-sm text-subtle-foreground sm:px-6">No published updates yet.</p>
  {:else}
    <ul class="divide-y divide-border-default">
      {#each updates as update (update.id)}
        <li class="px-4 py-5 sm:px-6" use:observeReleaseUpdate={update}>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${categoryClass(update.category)}`}
            >
              {update.category}
            </span>
            <time class="text-xs text-subtle-foreground" datetime={update.publishedAt}>
              {formatReleaseDate(update.publishedAt)}
            </time>
          </div>
          <h3 class="mt-3 text-base font-semibold text-foreground">{update.title}</h3>
          <p class="mt-1 text-sm leading-6 text-muted-foreground">{update.benefit}</p>
          {#if update.href && update.linkLabel}
            <a
              class="mt-3 inline-flex text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
              href={update.href}
              onclick={() =>
                trackProductEvent('release_cta_clicked', {
                  release_id: update.id,
                  feature_key: update.featureKey
                })}
            >
              {update.linkLabel}
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
