<script>
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.printbridge_title()} - GS1-128 Logistic Label Generator</title>
  <meta name="description" content={m.printbridge_meta()} />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8">
  <header
    class="overflow-hidden rounded-2xl bg-blue-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12"
  >
    <p class="text-sm font-semibold uppercase tracking-wider text-blue-100">
      {m.printbridge_optional()}
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">
      {m.printbridge_heading()}
    </h1>
    <p class="mt-4 max-w-3xl text-lg leading-7 text-blue-100">
      {m.printbridge_intro()}
    </p>
    <div class="mt-7 flex flex-col gap-3 sm:flex-row">
      <a
        href="https://github.com/JamesBolanos/print-bridge"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
      >
        {m.printbridge_view_github()}
      </a>
      <a
        href="https://github.com/JamesBolanos/print-bridge/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md border border-blue-200 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
      >
        {m.printbridge_view_downloads()}
      </a>
    </div>
  </header>

  <section
    aria-labelledby="how-it-works-heading"
    class="rounded-xl border border-border-default bg-surface p-6 shadow-sm sm:p-8"
  >
    <h2 id="how-it-works-heading" class="text-2xl font-bold text-foreground">
      {m.printbridge_how_it_works()}
    </h2>
    <ol class="mt-6 grid gap-4 md:grid-cols-3">
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {m.printbridge_step1_title()}
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {m.printbridge_step1_desc()}
        </p>
      </li>
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {m.printbridge_step2_title()}
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {m.printbridge_step2_desc()}
        </p>
      </li>
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {m.printbridge_step3_title()}
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {m.printbridge_step3_desc()}
        </p>
      </li>
    </ol>
  </section>

  <section
    aria-labelledby="what-you-need-heading"
    class="rounded-xl border border-border-default bg-surface p-6 shadow-sm sm:p-8"
  >
    <h2 id="what-you-need-heading" class="text-2xl font-bold text-foreground">
      {m.printbridge_what_you_need()}
    </h2>
    <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
      <li>{m.printbridge_need1()}</li>
      <li>{m.printbridge_need2()}</li>
      <li>
        {m.printbridge_need3()}
      </li>
    </ul>
    <p class="mt-4 text-sm leading-6 text-muted-foreground">
      {m.printbridge_setup_desc()}
    </p>
  </section>

  <nav aria-label="Related pages" class="flex flex-wrap gap-4 text-sm font-semibold">
    <a
      href={localizeHref('/guide')}
      class="text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
    >
      {m.printbridge_compare_labels()}
    </a>
    <a
      href={localizeHref('/settings')}
      class="text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
    >
      {m.printbridge_configure_printer()}
    </a>
  </nav>
</div>
