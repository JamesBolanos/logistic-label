<script>
  import LabelDiagram from '$lib/components/Guide/LabelDiagram.svelte';
  import { trackProductEvent } from '$lib/analytics/client.js';
  import { SUPPORTED_LABEL_GUIDES } from '$lib/labels/guide.js';
  import { LABEL_SCENARIOS, LABEL_SCENARIO_STATUSES } from '$lib/labels/scenarios.js';

  const laterScenarios = LABEL_SCENARIOS.filter(
    (scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE
  );
</script>

<svelte:head>
  <title>Supported Logistic Labels - SSCC Labels</title>
  <meta
    name="description"
    content="Compare the supported SSCC transport and identical-contents GS1-128 logistic labels, their data, barcodes, sizes, and intended use."
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
        class="rounded-xl border border-blue-200 bg-white p-5 shadow-sm hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span class="text-xs font-semibold uppercase tracking-wide text-blue-600"
          >{guide.category}</span
        >
        <span class="mt-2 block text-lg font-bold text-gray-900">{guide.title}</span>
        <span class="mt-2 block text-sm text-gray-600">{guide.summary}</span>
      </a>
    {/each}
  </nav>

  {#each SUPPORTED_LABEL_GUIDES as guide (guide.id)}
    <article
      id={guide.id}
      class="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-8"
    >
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">
            {guide.category}
          </p>
          <h2 class="mt-2 text-2xl font-bold text-gray-900">{guide.title}</h2>
          <p class="mt-3 max-w-3xl leading-7 text-gray-700">{guide.summary}</p>

          <div class="mt-7 grid gap-6 md:grid-cols-2">
            <section aria-labelledby={`${guide.id}-use`}>
              <h3 id={`${guide.id}-use`} class="font-semibold text-green-800">
                Use this label when
              </h3>
              <ul class="mt-2 space-y-2 text-sm text-gray-700">
                {#each guide.useWhen as item (item)}
                  <li class="flex gap-2">
                    <span aria-hidden="true" class="text-green-600">✓</span><span>{item}</span>
                  </li>
                {/each}
              </ul>
            </section>

            <section aria-labelledby={`${guide.id}-avoid`}>
              <h3 id={`${guide.id}-avoid`} class="font-semibold text-amber-800">
                Choose another solution when
              </h3>
              <ul class="mt-2 space-y-2 text-sm text-gray-700">
                {#each guide.avoidWhen as item (item)}
                  <li class="flex gap-2">
                    <span aria-hidden="true" class="text-amber-600">•</span><span>{item}</span>
                  </li>
                {/each}
              </ul>
            </section>
          </div>

          <div class="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <section>
              <h3 class="font-semibold text-gray-900">Information</h3>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Required
              </p>
              <ul class="mt-1 space-y-1 text-sm text-gray-700">
                {#each guide.requiredData as item (item)}<li>{item}</li>{/each}
              </ul>
              <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Optional
              </p>
              <ul class="mt-1 space-y-1 text-sm text-gray-700">
                {#each guide.optionalData as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-gray-900">Encoded barcodes</h3>
              <ul class="mt-2 space-y-2 text-sm text-gray-700">
                {#each guide.barcodeSummary as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-gray-900">Available PDF layouts</h3>
              <ul class="mt-2 space-y-2 text-sm text-gray-700">
                {#each guide.sizes as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>
          </div>

          <a
            href={guide.generatorHref}
            class="mt-8 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create this label
          </a>
        </div>

        <LabelDiagram labelType={guide.labelType} />
      </div>
    </article>
  {/each}

  <section
    class="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8"
    aria-labelledby="later-scenarios-heading"
  >
    <h2 id="later-scenarios-heading" class="text-2xl font-bold text-gray-900">
      Requirements outside the free generator
    </h2>
    <p class="mt-3 max-w-3xl text-gray-700">
      These situations need different GS1 rules, business data, or a customer routing guide. They
      remain visible so the current generator does not accept an ambiguous shipment.
    </p>
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      {#each laterScenarios as scenario (scenario.id)}
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-semibold text-gray-900">{scenario.title}</h3>
            <span
              class="shrink-0 rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
            >
              {scenario.statusLabel}
            </span>
          </div>
          <p class="mt-2 text-sm text-gray-600">{scenario.description}</p>
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

  <aside class="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
    These layouts apply the supported baseline rules in this generator. Confirm your trading
    partner’s current requirements and physically verify printed barcode quality before operational
    use.
  </aside>
</div>
