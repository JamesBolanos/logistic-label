<script>
  import { enhance } from '$app/forms';
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  import LabelDiagram from '#lib/components/Guide/LabelDiagram.svelte';
  import { trackProductEvent } from '#lib/analytics/client.ts';
  import { SUPPORTED_LABEL_GUIDES, localizeGuide } from '#lib/labels/guide.js';
  import { getLocale } from '#lib/paraglide/runtime.js';
  import {
    LABEL_SCENARIOS,
    LABEL_SCENARIO_STATUSES,
    localizeScenario
  } from '#lib/labels/scenarios.js';

  let { form, data } = $props();
  let submitting = $state(false);
  let submissionError = $state('');
  const initialRequestValues = (() => {
    const defaults = data?.requestDefaults || {};
    const submitted = form?.values || {};
    return {
      requestType: submitted.requestType ?? defaults.requestType ?? '',
      name: submitted.name ?? defaults.name ?? '',
      email: submitted.email ?? defaults.email ?? '',
      company: submitted.company ?? defaults.company ?? '',
      topic: submitted.topic ?? 'general',
      message: submitted.message ?? '',
      website: submitted.website ?? ''
    };
  })();
  let requestValues = $state({
    ...initialRequestValues
  });

  const requestTypes = [
    {
      value: 'improvement',
      title: m.guide_request_suggest(),
      description: m.guide_request_suggest_desc()
    },
    {
      value: 'tailored_project',
      title: m.guide_request_discuss(),
      description: m.guide_request_discuss_desc()
    }
  ];

  const requestTopics = [
    { value: 'general', label: m.guide_request_general() },
    { value: 'routing_guide', label: m.guide_request_routing() },
    { value: 'label_format', label: m.guide_request_label_format() },
    { value: 'printer_workflow', label: m.guide_request_printer() },
    { value: 'integration', label: m.guide_request_integration() },
    { value: 'other', label: m.guide_request_other() }
  ];

  const firstLabelSteps = [
    {
      title: 'Create your free account',
      description:
        'Your account gives you a private workspace for company settings and saved labels.'
    },
    {
      title: 'Set up your company',
      description:
        'Enter your company name, licensed GS1 Company Prefix, extension digit, and next serial reference. The licensed prefix is required to allocate a real SSCC; never make one up.'
    },
    {
      title: 'Choose a label and enter shipment details',
      description:
        'Pick the supported workflow that matches the logistic unit. Add Ship From/Ship To and any required product, count, lot, or date details.'
    },
    {
      title: 'Review the preview and checks',
      description:
        'Check the label layout and automated GS1 preflight results before saving. Previewing does not reserve a new SSCC.'
    },
    {
      title: 'Save, then download',
      description:
        'Saving allocates and reserves the SSCC using your company settings. Download the saved label as PDF or compatible ZPL.'
    }
  ];

  const firstLabelStepsEs = [
    {
      title: 'Crea tu cuenta gratuita',
      description:
        'Tu cuenta te da un espacio privado para la configuración de la empresa y las etiquetas guardadas.'
    },
    {
      title: 'Configura tu empresa',
      description:
        'Ingresa el nombre de tu empresa, el prefijo de empresa GS1 licenciado, el dígito de extensión y la siguiente referencia de serie. El prefijo licenciado es obligatorio para asignar un SSCC real; nunca inventes uno.'
    },
    {
      title: 'Elige una etiqueta e ingresa los detalles del envío',
      description:
        'Elige el flujo compatible que coincida con la unidad logística. Agrega Origen/Destino y los detalles de producto, cantidad, lote o fecha requeridos.'
    },
    {
      title: 'Revisa la vista previa y las verificaciones',
      description:
        'Verifica el diseño de la etiqueta y los resultados automáticos de preflight GS1 antes de guardar. La vista previa no reserva un nuevo SSCC.'
    },
    {
      title: 'Guarda y luego descarga',
      description:
        'Guardar asigna y reserva el SSCC usando la configuración de tu empresa. Descarga la etiqueta guardada como PDF o ZPL compatible.'
    }
  ];
  const locale = getLocale();
  const firstLabelStepsLocalized = locale.startsWith('es') ? firstLabelStepsEs : firstLabelSteps;

  const laterScenarios = LABEL_SCENARIOS.filter(
    (scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE
  ).map((scenario) => localizeScenario(scenario, locale));
  const supportedGuides = SUPPORTED_LABEL_GUIDES.map((guide) => localizeGuide(guide, locale));

  function enhanceRequest() {
    submitting = true;
    return async ({ result, update }) => {
      if (result.type === 'error') {
        submitting = false;
        submissionError = m.guide_request_error();
        return;
      }

      submissionError = '';
      await update();
      submitting = false;

      if (result.type === 'success' && result.data?.success) {
        trackProductEvent('custom_request_submitted', {
          request_type: result.data.requestType
        });
      }
    };
  }
</script>

<svelte:head>
  <title>{m.guide_title()} - SSCC Labels</title>
  <meta name="description" content={m.guide_supported_label_guide_meta()} />
</svelte:head>

<div class="space-y-12 pb-12">
  <header class="rounded-2xl bg-blue-700 px-6 py-12 text-center text-white shadow-lg sm:px-10">
    <p class="text-sm font-semibold uppercase tracking-wider text-blue-100">
      {m.guide_supported_label_guide()}
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">{m.guide_which_label()}</h1>
    <p class="mx-auto mt-4 max-w-3xl text-lg text-blue-100">
      {m.guide_intro2()}
    </p>
  </header>

  <section
    id="first-label"
    aria-labelledby="first-label-heading"
    class="rounded-2xl border border-blue-200 bg-surface p-6 shadow-md dark:border-blue-900 sm:p-8"
  >
    <div class="max-w-4xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        {m.guide_step_by_step()}
      </p>
      <h2 id="first-label-heading" class="mt-2 text-2xl font-bold text-foreground">
        {m.guide_setup_company()}
      </h2>
      <p class="mt-3 leading-7 text-muted-foreground">
        {m.guide_setup_desc()}
      </p>
    </div>

    <ol class="mt-7 grid gap-4 md:grid-cols-2">
      {#each firstLabelStepsLocalized as step, index (step.title)}
        <li class="flex gap-4 rounded-lg border border-border-default bg-surface-muted p-4">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
            aria-hidden="true">{index + 1}</span
          >
          <div>
            <h3 class="font-semibold text-foreground">{step.title}</h3>
            <p class="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
          </div>
        </li>
      {/each}
    </ol>

    <div
      class="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h3 class="text-base font-semibold text-foreground">{m.guide_important_notes()}</h3>
      <ul class="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
        <li>
          <strong class="text-foreground">{m.guide_gs1_prefix_label()}</strong>
          {m.guide_gs1_prefix_desc()}
        </li>
      </ul>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">{m.guide_baseline_rules()}</p>
    </div>
  </section>

  {#each supportedGuides as guide (guide.id)}
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
                {m.guide_use_this_label_when()}
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
                {m.guide_choose_another()}
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
              <h3 class="font-semibold text-foreground">{m.guide_information()}</h3>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
                {m.guide_required()}
              </p>
              <ul class="mt-1 space-y-1 text-sm text-muted-foreground">
                {#each guide.requiredData as item (item)}<li>{item}</li>{/each}
              </ul>
              <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
                {m.guide_optional()}
              </p>
              <ul class="mt-1 space-y-1 text-sm text-muted-foreground">
                {#each guide.optionalData as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-foreground">{m.guide_encoded_barcodes()}</h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.barcodeSummary as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>

            <section>
              <h3 class="font-semibold text-foreground">{m.guide_available_layouts()}</h3>
              <ul class="mt-2 space-y-2 text-sm text-muted-foreground">
                {#each guide.sizes as item (item)}<li>{item}</li>{/each}
              </ul>
            </section>
          </div>

          <a
            href={guide.generatorHref}
            class="mt-8 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
          >
            {m.guide_create_this_label()}
          </a>
        </div>

        <LabelDiagram labelType={guide.labelType} printLayout={guide.sampleLayout} />
      </div>
    </article>
  {/each}

  <section
    id="saved-products"
    class="scroll-mt-24 rounded-2xl border border-border-default bg-surface-muted p-6 sm:p-8"
    aria-labelledby="saved-products-heading"
  >
    <h2 id="saved-products-heading" class="text-2xl font-bold text-foreground">
      {m.guide_ship_same_products()}
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      {m.guide_ship_same_desc()}
    </p>
    <a
      href={localizeHref('/settings')}
      class="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      {m.guide_manage_saved_products()}
    </a>
  </section>

  <section
    id="download-formats"
    class="scroll-mt-24 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-6 sm:p-8"
    aria-labelledby="download-formats-heading"
  >
    <h2 id="download-formats-heading" class="text-2xl font-bold text-foreground">
      {m.guide_download_print()}
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      {m.guide_download_print_desc()}
    </p>
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div>
        <h3 class="font-semibold text-foreground">{m.guide_pdf()}</h3>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {m.guide_pdf_desc2()}
        </p>
      </div>
      <div>
        <h3 class="font-semibold text-foreground">{m.guide_zpl()}</h3>
        <ol class="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>{m.guide_zpl_step1()}</li>
          <li>{m.guide_zpl_step2()}</li>
          <li>{m.guide_zpl_step3()}</li>
        </ol>
      </div>
    </div>
    <p class="mt-5 text-sm text-muted-foreground">
      {m.guide_zpl_media()}
    </p>
    <div class="mt-6 border-t border-blue-200 dark:border-blue-900 pt-6">
      <h3 class="font-semibold text-foreground">{m.guide_print_network()}</h3>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {m.guide_print_network_desc()}
      </p>
      <p class="mt-3 text-sm font-medium text-blue-900 dark:text-blue-200">
        {m.guide_print_network()}
      </p>
      <p class="mt-3 text-sm leading-6 text-muted-foreground">
        <a
          href={localizeHref('/print-bridge')}
          class="font-medium text-blue-700 dark:text-blue-300 underline"
          >{m.guide_learn_print_bridge()}</a
        >, then follow the
        <a
          href="https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-blue-700 dark:text-blue-300 underline"
          >{m.guide_setup_guide_link()}</a
        >, then save your printer address and resolution in
        <a
          href={localizeHref('/settings')}
          class="font-medium text-blue-700 dark:text-blue-300 underline"
          >{m.guide_settings_link()}</a
        >. {m.guide_test_bridge()}
      </p>
    </div>
    <a
      href={localizeHref('/labels/history')}
      class="mt-6 inline-flex rounded-md bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      {m.guide_open_saved_labels()}
    </a>
  </section>

  <section
    class="rounded-2xl border border-border-default bg-surface-muted p-6 sm:p-8"
    aria-labelledby="later-scenarios-heading"
  >
    <h2 id="later-scenarios-heading" class="text-2xl font-bold text-foreground">
      {m.guide_beyond_free()}
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      {m.guide_beyond_free_desc()}
    </p>
    <div class="mt-6 grid gap-4 md:grid-cols-1">
      {#each laterScenarios as scenario (scenario.id)}
        <div class="rounded-lg border border-blue-200 bg-surface p-5 dark:border-blue-900">
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            {m.guide_possible_tailored()}
          </p>
          <h3 class="mt-2 font-semibold text-foreground">{scenario.title}</h3>
          <p class="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
        </div>
      {/each}
    </div>

    <p class="mt-6 text-sm leading-6 text-muted-foreground">
      {m.guide_possible_starting()}
    </p>
    <a
      href="#custom-request"
      onclick={() => trackProductEvent('custom_contact_clicked', { placement: 'guide_cta' })}
      class="mt-5 inline-flex rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      {m.guide_suggest_improvement()}
    </a>
  </section>

  <section
    id="custom-request"
    class="scroll-mt-24 rounded-2xl border border-blue-200 bg-surface p-6 shadow-md dark:border-blue-900 sm:p-8"
    aria-labelledby="custom-request-heading"
  >
    <div class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        {m.guide_custom_request()}
      </p>
      <h2 id="custom-request-heading" class="mt-2 text-2xl font-bold text-foreground">
        {m.guide_tell_me_what_you_need()}
      </h2>
      <p class="mt-3 leading-7 text-muted-foreground">
        {m.guide_custom_request_desc2()}
      </p>
      {#if data?.companyPrefillWarning}
        <p class="mt-3 text-sm text-amber-800 dark:text-amber-200" role="status">
          {data.companyPrefillWarning}
        </p>
      {/if}
    </div>

    {#if submissionError}
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        {submissionError}
      </div>
    {:else if form?.success}
      <div
        class="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200"
        role="status"
      >
        {m.guide_request_success()}
      </div>
    {:else if form?.message}
      <div
        class="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
        role="alert"
      >
        {form.message}
      </div>
    {/if}

    <form
      method="POST"
      action="?/submitRequest"
      use:enhance={enhanceRequest}
      class="mt-7 space-y-6"
    >
      <fieldset>
        <legend class="text-sm font-semibold text-foreground"
          >{m.guide_what_would_you_like()}</legend
        >
        {#if form?.errors?.requestType}
          <p id="request-type-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
            {form.errors.requestType}
          </p>
        {/if}
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          {#each requestTypes as requestType (requestType.value)}
            <label
              class="flex cursor-pointer gap-3 rounded-lg border border-border-default p-4 hover:border-blue-500"
            >
              <input
                type="radio"
                name="requestType"
                value={requestType.value}
                bind:group={requestValues.requestType}
                aria-describedby={form?.errors?.requestType ? 'request-type-error' : undefined}
                required
              />
              <span>
                <span class="block font-semibold text-foreground">{requestType.title}</span>
                <span class="mt-1 block text-sm text-muted-foreground"
                  >{requestType.description}</span
                >
              </span>
            </label>
          {/each}
        </div>
      </fieldset>

      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label for="request-name" class="mb-1 block text-sm font-medium text-foreground">
            {m.guide_request_name()}
            <span class="font-normal text-subtle-foreground">{m.guide_request_name_optional()}</span
            >
          </label>
          <input
            id="request-name"
            name="name"
            type="text"
            autocomplete="name"
            maxlength="120"
            bind:value={requestValues.name}
            aria-describedby={form?.errors?.name ? 'request-name-error' : undefined}
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if form?.errors?.name}
            <p id="request-name-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
              {form.errors.name}
            </p>
          {/if}
        </div>

        <div>
          <label for="request-email" class="mb-1 block text-sm font-medium text-foreground">
            {m.guide_request_email()} <span aria-hidden="true" class="text-red-700">*</span>
          </label>
          <input
            id="request-email"
            name="email"
            type="email"
            autocomplete="email"
            maxlength="254"
            required
            bind:value={requestValues.email}
            aria-describedby={form?.errors?.email ? 'request-email-error' : 'request-email-help'}
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if form?.errors?.email}
            <p id="request-email-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
              {form.errors.email}
            </p>
          {:else}
            <p id="request-email-help" class="mt-1 text-xs text-subtle-foreground">
              {m.guide_request_email_help()}
            </p>
          {/if}
        </div>

        <div>
          <label for="request-company" class="mb-1 block text-sm font-medium text-foreground">
            {m.guide_request_company()}
            <span class="font-normal text-subtle-foreground"
              >{m.guide_request_company_optional()}</span
            >
          </label>
          <input
            id="request-company"
            name="company"
            type="text"
            autocomplete="organization"
            maxlength="160"
            bind:value={requestValues.company}
            aria-describedby={form?.errors?.company ? 'request-company-error' : undefined}
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {#if form?.errors?.company}
            <p id="request-company-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
              {form.errors.company}
            </p>
          {/if}
        </div>

        <div>
          <label for="request-topic" class="mb-1 block text-sm font-medium text-foreground">
            {m.guide_request_topic()}
          </label>
          <select
            id="request-topic"
            name="topic"
            bind:value={requestValues.topic}
            aria-describedby={form?.errors?.topic ? 'request-topic-error' : undefined}
            class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each requestTopics as topic (topic.value)}
              <option value={topic.value}>{topic.label}</option>
            {/each}
          </select>
          {#if form?.errors?.topic}
            <p id="request-topic-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
              {form.errors.topic}
            </p>
          {/if}
        </div>
      </div>

      <div>
        <label for="request-message" class="mb-1 block text-sm font-medium text-foreground">
          {m.guide_request_message()} <span aria-hidden="true" class="text-red-700">*</span>
        </label>
        <textarea
          id="request-message"
          name="message"
          rows="5"
          minlength="10"
          maxlength="2000"
          required
          bind:value={requestValues.message}
          aria-describedby={form?.errors?.message
            ? 'request-message-error'
            : 'request-message-help'}
          class="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        {#if form?.errors?.message}
          <p id="request-message-error" class="mt-1 text-sm text-red-700 dark:text-red-300">
            {form.errors.message}
          </p>
        {:else}
          <p id="request-message-help" class="mt-1 text-xs text-subtle-foreground">
            {m.guide_request_message_help()}
          </p>
        {/if}
      </div>

      <div class="sr-only" aria-hidden="true">
        <label for="request-website">{m.guide_request_leave_empty()}</label>
        <input
          id="request-website"
          name="website"
          type="text"
          tabindex="-1"
          autocomplete="off"
          bind:value={requestValues.website}
        />
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting}
          class="inline-flex items-center justify-center rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? m.guide_request_sending() : m.guide_request_send()}
        </button>
        <p class="text-sm text-muted-foreground">
          {m.guide_prefer_email()}
          <a
            href="mailto:jbolanosdiaz@gmail.com"
            onclick={() =>
              trackProductEvent('custom_contact_clicked', { placement: 'guide_email_fallback' })}
            class="font-medium text-blue-700 underline dark:text-blue-300"
            >{m.guide_contact_directly()}</a
          >.
        </p>
      </div>
    </form>
  </section>
</div>
