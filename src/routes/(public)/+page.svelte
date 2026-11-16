<!-- src/routes/+page.svelte -->
<script>
  import { page } from '$app/state';
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  import { trackProductEvent } from '#lib/analytics/client.ts';

  let isLoggedIn = $derived(Boolean(page.data.user));

  const features = [
    {
      title: m.home_feature_shipping_title(),
      description: m.home_feature_shipping_description(),
      icon: 'check'
    },
    {
      title: m.home_feature_layout_title(),
      description: m.home_feature_layout_description(),
      icon: 'layout'
    },
    {
      title: m.home_feature_download_title(),
      description: m.home_feature_download_description(),
      icon: 'file'
    },
    {
      title: m.home_feature_history_title(),
      description: m.home_feature_history_description(),
      icon: 'clipboard'
    },
    {
      title: m.home_feature_private_title(),
      description: m.home_feature_private_description(),
      icon: 'lock'
    },
    {
      title: m.home_feature_tailored_title(),
      description: m.home_feature_tailored_description(),
      icon: 'database'
    }
  ];
</script>

<svelte:head>
  <title>{m.home_seo_title()}</title>
  <meta name="description" content={m.home_seo_description()} />
</svelte:head>

<div class="pb-16">
  <div class="bg-blue-600 rounded-lg shadow-lg overflow-hidden">
    <div class="max-w-5xl mx-auto px-6 py-16 text-center text-white">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
        {m.home_hero_badge()}
      </p>
      <h1 class="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
        {m.home_hero_title()}
      </h1>
      <p class="mt-6 text-xl max-w-3xl mx-auto">
        {m.home_hero_description()}
      </p>
      <p class="mt-4 text-base text-blue-100 max-w-3xl mx-auto">
        {m.home_hero_note()}
      </p>
      <div class="mt-10">
        <div class="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
          {#if isLoggedIn}
            <a
              href={localizeHref('/labels')}
              class="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 md:text-lg"
            >
              {m.nav_label_generator()}
            </a>
            <a
              href={localizeHref('/dashboard')}
              class="flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:text-lg"
            >
              {m.nav_dashboard()}
            </a>
          {:else}
            <a
              href={localizeHref('/signup')}
              class="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 md:text-lg"
            >
              {m.home_start_free()}
            </a>
          {/if}
          <a
            href={localizeHref('/guide')}
            class="flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:text-lg"
          >
            {m.home_view_guide()}
          </a>
        </div>
        <p class="mt-5 text-sm text-blue-100">
          {m.home_custom_prompt()}
          <a
            href={localizeHref('/guide#custom-request')}
            onclick={() => trackProductEvent('custom_contact_clicked', { placement: 'home_hero' })}
            class="font-semibold text-white underline decoration-blue-200 underline-offset-4 hover:text-blue-50"
          >
            {m.home_discuss_project()}
          </a>
        </p>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="mt-16">
    <h2 class="text-3xl font-extrabold text-foreground text-center mb-12">
      {m.home_features_heading()}
    </h2>
    <p class="-mt-8 mb-10 text-center text-muted-foreground">
      {m.home_compare_prompt()}
      <a
        href={localizeHref('/guide')}
        class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
      >
        {m.home_compare_link()}
      </a>
    </p>
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {#each features as feature (feature.title)}
        <div class="bg-surface p-6 rounded-lg shadow-md border border-border-default">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4"
          >
            {#if feature.icon === 'check'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            {:else if feature.icon === 'layout'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                />
              </svg>
            {:else if feature.icon === 'file'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            {:else if feature.icon === 'clipboard'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            {:else if feature.icon === 'lock'}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            {/if}
          </div>
          <h3 class="text-lg font-bold mb-2">{feature.title}</h3>
          <p class="text-muted-foreground">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- GS1 Info Section -->
  <div class="mt-16 bg-surface-muted p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-foreground mb-6">
      {m.home_solution_heading()}
    </h2>
    <div class="prose max-w-none">
      <p>
        {m.home_solution_intro()}
      </p>
      <p class="mt-4">
        {m.home_solution_guided_by()}
        <a
          href="https://www.gs1.org/docs/tl/GS1_Logistic_Label_Guideline.pdf"
          target="_blank"
          rel="noreferrer"
          class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-400"
        >
          GS1 Logistic Label Guideline
        </a>.
      </p>
      <p class="mt-4">
        {m.home_solution_for_companies()}
      </p>
      <ul class="mt-2">
        <li>{m.home_solution_size()}</li>
        <li>{m.home_solution_printers()}</li>
        <li>{m.home_solution_fields()}</li>
        <li>{m.home_solution_workflows()}</li>
      </ul>
      <p class="mt-4">{m.home_generator_heading()}</p>
      <ul class="mt-2">
        <li>{m.home_generator_sscc()}</li>
        <li>{m.home_generator_homogeneous()}</li>
        <li>{m.home_generator_basic()}</li>
        <li>{m.home_generator_traceability()}</li>
        <li>{m.home_generator_barcode()}</li>
      </ul>
    </div>
  </div>

  <!-- CTA Section -->
  <div class="mt-16 text-center">
    <h2 class="text-3xl font-extrabold text-foreground sm:text-4xl">
      {m.home_final_heading()}
    </h2>
    <p class="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
      {m.home_final_description()}
    </p>
    <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      {#if isLoggedIn}
        <a
          href={localizeHref('/labels')}
          class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg"
        >
          {m.nav_label_generator()}
        </a>
      {:else}
        <a
          href={localizeHref('/signup')}
          class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg"
        >
          {m.home_start_free()}
        </a>
      {/if}
      <a
        href={localizeHref('/guide#custom-request')}
        onclick={() => trackProductEvent('custom_contact_clicked', { placement: 'home_cta' })}
        class="inline-flex items-center justify-center px-8 py-3 border border-border-strong text-base font-medium rounded-md text-foreground bg-surface hover:bg-surface-muted md:text-lg"
      >
        {m.home_suggest_project()}
      </a>
    </div>
  </div>
</div>
