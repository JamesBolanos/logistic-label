<script>
  import { formatReleaseDate } from '$lib/content/releases.js';
  import { observeReleaseUpdate, trackProductEvent } from '$lib/analytics/client.js';

  let { updates = [] } = $props();

  function categoryClass(category) {
    if (category === 'fix') return 'bg-red-50 text-red-700 ring-red-600/20';
    if (category === 'improvement') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }
</script>

<section
  aria-labelledby="whats-new-heading"
  class="overflow-hidden rounded-lg border border-blue-100 bg-white shadow"
>
  <div
    class="flex flex-col gap-3 border-b border-gray-100 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
  >
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Product updates</p>
      <h2 id="whats-new-heading" class="mt-1 text-lg font-semibold text-gray-900">What's new</h2>
    </div>
    <a
      class="text-sm font-semibold text-blue-600 hover:text-blue-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      href="/updates"
    >
      View all updates
    </a>
  </div>

  {#if updates.length === 0}
    <p class="px-4 py-6 text-sm text-gray-500 sm:px-6">No published updates yet.</p>
  {:else}
    <ul class="divide-y divide-gray-100">
      {#each updates as update (update.id)}
        <li class="px-4 py-5 sm:px-6" use:observeReleaseUpdate={update}>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${categoryClass(update.category)}`}
            >
              {update.category}
            </span>
            <time class="text-xs text-gray-500" datetime={update.publishedAt}>
              {formatReleaseDate(update.publishedAt)}
            </time>
          </div>
          <h3 class="mt-3 text-base font-semibold text-gray-900">{update.title}</h3>
          <p class="mt-1 text-sm leading-6 text-gray-600">{update.benefit}</p>
          {#if update.href && update.linkLabel}
            <a
              class="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
