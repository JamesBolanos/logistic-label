<script>
  import LabelDiagram from '#lib/components/Guide/LabelDiagram.svelte';
  import { trackProductEvent } from '#lib/analytics/client.ts';
  import { SUPPORTED_LABEL_GUIDES } from '#lib/labels/guide.js';
  import { LABEL_SCENARIOS, LABEL_SCENARIO_STATUSES } from '#lib/labels/scenarios.js';

  const laterScenarios = LABEL_SCENARIOS.filter(
    (scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE
  );
</script>

<svelte:head>
  <title>Supported Logistic Labels - SSCC Labels</title>
  <meta
    name="description"
    content="Compare supported GS1-128 logistic labels, their data, barcodes, and sizes. Learn how to download PDF or ZPL files and select your printer resolution."
  />
</svelte:head>

<div class="space-y-12 pb-12">
  <header class="rounded-2xl bg-blue-700 px-6 py-12 text-center text-white shadow-lg sm:px-10">
    <p class="text-sm font-semibold uppercase tracking-wider text-blue-100">
      Supported label guide
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">Which label fits your shipment?</h1>
    <p class="mx-auto mt-4 max-w-3xl text-lg text-blue-100">
      Start with the physical shipping situation. The free generator currently supports two clear
      uses and keeps later or customer-specific requirements separate.
    </p>
  </header>

  <nav aria-label="Supported label choices" class="grid gap-4 md:grid-cols-2">
    {#each SUPPORTED_LABEL_GUIDES as guide (guide.id)}
      <a
        href={`#${guide.id}`}
        class="rounded-xl border border-blue-200 bg-surface p-5 shadow-sm hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-900 dark:hover:bg-blue-950/40"
      >
        <span class="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400"
          >{guide.category}</span
        >
        <span class="mt-2 block text-lg font-bold text-foreground">{guide.title}</span>
        <span class="mt-2 block text-sm text-muted-foreground">{guide.summary}</span>
      </a>
    {/each}
  </nav>

  {#each SUPPORTED_LABEL_GUIDES as guide (guide.id)}
    <article
      id={guide.id}
      class="scroll-mt-24 rounded-2xl border border-border-default bg-surface p-6 shadow-md sm:p-8"
    >
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {guide.category}
          </p>
          <h2 class="mt-2 text-2xl font-bold text-foreground">{guide.title}</h2>
          <p class="mt-3 max-w-3xl leading-7 text-muted-foreground">{guide.summary}</p>

          <div class="mt-7 grid gap-6 md:grid-cols-2">
            <section aria-labelledby={`${guide.id}-use`}>
              <h3 id={`${guide.id}-use`} class="font-semibold text-green-800 dark:text-green-300">
                Use this label when
              </h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.useWhen as item (item)}
                  <li class="flex gap-2">
                    <span aria-hidden="true" class="text-green-600 dark:text-green-400">✓</span
                    ><span>{item}</span>
                  </li>
                {/each}
              </ul>
            </section>

            <section aria-labelledby={`${guide.id}-avoid`}>
              <h3 id={`${guide.id}-avoid`} class="font-semibold text-amber-800 dark:text-amber-300">
                Choose another solution when
              </h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.avoidWhen as item (item)}
                  <li class="flex gap-2">
                    <span aria-hidden="true" class="text-amber-600 dark:text-amber-400">•</span
                    ><span>{item}</span>
                  </li>
                {/each}
              </ul>
            </section>
          </div>

          <div class="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <section>
              <h3 class="font-semibold text-foreground">Information</h3>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
                Required
              </p>
              <ul class="mt-1 space-y-1 text-sm text-muted-foreground">
                {#each guide.requiredData as item (item)}<li>{item}</li>{/each}
              </ul>
              <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
                Optional
              </p>
              <ul class="mt-1 space-y-1 text-sm text-muted-foreground">
                {#each guide.optionalData as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-foreground">Encoded barcodes</h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.barcodeSummary as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-foreground">Available PDF and ZPL layouts</h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.sizes as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>
          </div>

          <a
            href={guide.generatorHref}
            class="mt-8 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
          >
            Create this label
          </a>
        </div>

        <LabelDiagram labelType={guide.labelType} />
      </div>
    </article>
  {/each}

  <section
    id="saved-products"
    class="scroll-mt-24 rounded-2xl border border-border-default bg-surface-muted p-6 sm:p-8"
    aria-labelledby="saved-products-heading"
  >
    <h2 id="saved-products-heading" class="text-2xl font-bold text-foreground">
      Ship the same products often?
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      Save your products with their GTINs in Settings, then select one when creating an
      identical-contents label to fill its GTIN. Shipment details such as lot, date, count, and
      addresses stay on each label.
    </p>
    <a
      href="/settings"
      class="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      Manage saved products
    </a>
  </section>

  <section
    id="download-formats"
    class="scroll-mt-24 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-6 sm:p-8"
    aria-labelledby="download-formats-heading"
  >
    <h2 id="download-formats-heading" class="text-2xl font-bold text-foreground">
      Download and print your label
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      Both supported label types are available as PDF and ZPL. Downloads keep the saved label's
      layout, information, and SSCC, so downloading another format does not create a new SSCC.
    </p>
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div>
        <h3 class="font-semibold text-foreground">PDF for viewing and printing</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          A PDF downloads automatically when you generate and save a label. You can download it
          again from Saved labels. Print at 100% scale on matching label stock to preserve barcode
          dimensions.
        </p>
      </div>
      <div>
        <h3 class="font-semibold text-foreground">ZPL for compatible thermal printers</h3>
        <ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Generate and save your label, or use an existing record in Saved labels.</li>
          <li>
            Set ZPL printer resolution to match your printer: 203, 300, or 600 dpi. Check your
            printer settings if you are unsure.
          </li>
          <li>
            Click Download ZPL, then send the downloaded .zpl file using your printer software.
          </li>
        </ol>
      </div>
    </div>
    <p class="mt-5 text-sm text-muted-foreground">
      Use media and a printer wide enough for the selected layout. A 6 × 8 label requires a six-inch
      print width. The two-copy layout places both copies on one 4 × 6 sheet.
    </p>
    <div class="mt-6 border-t border-blue-200 dark:border-blue-900 pt-6">
      <h3 class="font-semibold text-foreground">Print directly over your local network</h3>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        With Print Bridge running on your computer, choose Print via bridge in Saved labels. Your
        browser sends the saved label to the bridge, which forwards it to your ZPL-compatible
        network printer. The same saved SSCC is reused each time you send a copy.
      </p>
      <p class="mt-3 text-sm font-medium text-blue-900 dark:text-blue-200">
        SSCC Labels → Print Bridge on your computer → Network printer
      </p>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">
        <a
          href="https://github.com/JamesBolanos/print-bridge/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-blue-700 dark:text-blue-300 underline">Download Print Bridge</a
        >, follow the
        <a
          href="https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-blue-700 dark:text-blue-300 underline">setup guide</a
        >, then save your printer address and resolution in
        <a href="/settings" class="font-medium text-blue-700 dark:text-blue-300 underline"
          >Settings</a
        >. Test bridge connection checks that the bridge is reachable; check your first physical
        label too.
      </p>
    </div>
    <a
      href="/labels/history"
      class="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      Open saved labels
    </a>
  </section>

  <section
    class="rounded-2xl border border-border-default bg-surface-muted p-6 sm:p-8"
    aria-labelledby="later-scenarios-heading"
  >
    <h2 id="later-scenarios-heading" class="text-2xl font-bold text-foreground">
      Requirements outside the free generator
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      These situations need different GS1 rules, business data, or a customer routing guide. They
      remain visible so the current generator does not accept an ambiguous shipment.
    </p>
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      {#each laterScenarios as scenario (scenario.id)}
        <div class="rounded-lg border border-border-default bg-surface p-4">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold text-foreground">{scenario.title}</h3>
            <span
              class="shrink-0 rounded-full bg-surface-strong px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {scenario.statusLabel}
            </span>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
        </div>
      {/each}
    </div>

    <div class="mt-8 rounded-lg bg-blue-700 p-6 text-white">
      <h3 class="text-xl font-bold">Need a customer-specific label or workflow?</h3>
      <p class="mt-2 max-w-3xl text-blue-100">
        A tailored implementation can cover routing-guide fields, other sizes or print formats,
        printer delivery, shipment data, user roles, and integrations.
      </p>
      <a
        href="mailto:jbolanosdiaz@gmail.com?subject=Tailored%20logistic%20label%20implementation"
        onclick={() => trackProductEvent('custom_contact_clicked', { placement: 'guide_cta' })}
        class="mt-4 inline-flex rounded-md bg-white px-4 py-2 font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
      >
        Discuss a tailored solution
      </a>
    </div>
  </section>

  <aside
    class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 text-sm text-amber-950 dark:text-amber-100"
  >
    These layouts apply the supported baseline rules in this generator. Confirm your trading
    partner’s current requirements and physically verify printed barcode quality before operational
    use.
  </aside>
</div>
