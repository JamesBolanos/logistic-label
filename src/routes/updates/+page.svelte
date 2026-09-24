<script>
  import { formatReleaseDate, getPublishedReleases } from '$lib/content/releases.js';
  import { observeReleaseUpdate, trackProductEvent } from '$lib/analytics/client.js';

  const updates = getPublishedReleases();

  function categoryClass(category) {
    if (category === 'fix') return 'bg-red-50 text-red-700 ring-red-600/20';
    if (category === 'improvement') return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
  }
</script>

<svelte:head>
  <title>What's New - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Released fixes, improvements, and new features in the GS1-128 Logistic Label Generator."
  />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8">
  <header>
    <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Release history</p>
    <h1 class="mt-2 text-3xl font-bold tracking-tight text-gray-900">What's new</h1>
    <p class="mt-3 max-w-2xl text-base leading-7 text-gray-600">
      Review the fixes, improvements, and new features that are available in the application.
      Planned work remains in the product backlog until it is released.
    </p>
  </header>

  {#if updates.length === 0}
    <section class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow">
      No updates have been published yet.
    </section>
  {:else}
    <ol class="space-y-5">
      {#each updates as update (update.id)}
        <li
          class="rounded-lg border border-gray-200 bg-white p-6 shadow"
          use:observeReleaseUpdate={update}
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${categoryClass(update.category)}`}
            >
              {update.category}
            </span>
            <time class="text-sm text-gray-500" datetime={update.publishedAt}>
              {formatReleaseDate(update.publishedAt)}
            </time>
          </div>
          <h2 class="mt-4 text-xl font-semibold text-gray-900">{update.title}</h2>
          <p class="mt-2 leading-7 text-gray-600">{update.benefit}</p>
          {#if update.href && update.linkLabel && update.href !== '/updates'}
            <a
              class="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
    </ol>
  {/if}
</div>
