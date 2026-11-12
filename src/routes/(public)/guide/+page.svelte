<script>
  import { enhance } from '$app/forms';
  import LabelDiagram from '#lib/components/Guide/LabelDiagram.svelte';
  import { trackProductEvent } from '#lib/analytics/client.ts';
  import { SUPPORTED_LABEL_GUIDES } from '#lib/labels/guide.js';
  import { LABEL_SCENARIOS, LABEL_SCENARIO_STATUSES } from '#lib/labels/scenarios.js';

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
      title: 'Suggest an improvement',
      description: 'Share an idea for the free generator or its public guide.'
    },
    {
      value: 'tailored_project',
      title: 'Discuss a tailored project',
      description: 'Describe a customer, printer, label, or workflow requirement.'
    }
  ];

  const requestTopics = [
    { value: 'general', label: 'General or not sure yet' },
    { value: 'routing_guide', label: 'Customer or retailer routing guide' },
    { value: 'label_format', label: 'Label size or format' },
    { value: 'printer_workflow', label: 'Printer workflow' },
    { value: 'integration', label: 'Data or system integration' },
    { value: 'other', label: 'Other' }
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

  const laterScenarios = LABEL_SCENARIOS.filter(
    (scenario) => scenario.status !== LABEL_SCENARIO_STATUSES.AVAILABLE
  );

  function enhanceRequest() {
    submitting = true;
    return async ({ result, update }) => {
      if (result.type === 'error') {
        submitting = false;
        submissionError =
          'We could not confirm your request was sent. Please try again or contact me directly.';
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
      The free generator supports three label workflows. Compare their static label samples, then
      follow the steps from company setup to saving a real label.
    </p>
  </header>

  <section
    id="first-label"
    aria-labelledby="first-label-heading"
    class="rounded-2xl border border-blue-200 bg-surface p-6 shadow-md dark:border-blue-900 sm:p-8"
  >
    <div class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
        Step-by-step manual
      </p>
      <h2 id="first-label-heading" class="mt-2 text-2xl font-bold text-foreground">
        Set up your company before creating a real SSCC
      </h2>
      <p class="mt-3 leading-7 text-muted-foreground">
        Every real logistic label needs an SSCC. Creating one requires a GS1 Company Prefix licensed
        to your organization; the app cannot create a valid SSCC without it. You can inspect the
        examples below without signing in. Each static sample follows the app's single-label print
        layout for its workflow, but uses non-scannable barcode placeholders and is not valid for
        shipping.
      </p>
    </div>

    <ol class="mt-7 grid gap-4 md:grid-cols-2">
      {#each firstLabelSteps as step, index (step.title)}
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
      class="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30"
    >
      <h3 class="text-lg font-semibold text-foreground">Company details you will need</h3>
      <ul class="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        <li>
          <strong class="text-foreground">Company name:</strong> shown in your company profile and applied
          where appropriate to your labels.
        </li>
        <li>
          <strong class="text-foreground">GS1 Company Prefix:</strong> use the numeric prefix licensed
          to your organization by a GS1 Member Organisation. Do not invent a prefix. If you do not have
          one, you cannot create a valid real SSCC yet. The prefix contributes to the SSCC but is not
          printed as a separate field on these sample labels.
        </li>
        <li>
          <strong class="text-foreground">Extension digit and next serial reference:</strong>
          together with your licensed prefix, these settings support SSCC allocation when you save a label.
        </li>
      </ul>
      <p
        class="mt-4 border-t border-amber-200 pt-4 text-sm leading-6 text-muted-foreground dark:border-amber-900"
      >
        Ship From, Ship To, and product or shipment details are entered later for the label you
        choose. They are not company allocation settings.
      </p>
      <a
        href="/signup"
        class="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
      >
        Create a free account
      </a>
    </div>
  </section>

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
      All three supported label workflows are available as PDF and ZPL. Downloads keep the saved
      label's layout, information, and SSCC, so downloading another format does not create a new
      SSCC.
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
      Need something beyond the free generator?
    </h2>
    <p class="mt-3 max-w-3xl text-muted-foreground">
      The three free workflows cover common logistic-label needs. If a customer requirement needs a
      different layout, printer workflow, or integration, we can discuss a tailored project.
    </p>
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      {#each laterScenarios as scenario (scenario.id)}
        <div class="rounded-lg border border-blue-200 bg-surface p-5 dark:border-blue-900">
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            A possible tailored need
          </p>
          <h3 class="mt-2 font-semibold text-foreground">{scenario.title}</h3>
          <p class="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
        </div>
      {/each}
    </div>

    <p class="mt-6 text-sm leading-6 text-muted-foreground">
      Possible starting points include customer routing-guide fields, other label sizes or print
      formats, printer delivery, shipment data, user roles, and integrations. Each request is
      reviewed individually.
    </p>
    <a
      href="#custom-request"
      onclick={() => trackProductEvent('custom_contact_clicked', { placement: 'guide_cta' })}
      class="mt-5 inline-flex rounded-md bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      Suggest an improvement or discuss a project
    </a>
  </section>

  <section
    id="custom-request"
    class="scroll-mt-24 rounded-2xl border border-blue-200 bg-surface p-6 shadow-md dark:border-blue-900 sm:p-8"
    aria-labelledby="custom-request-heading"
  >
    <div class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        Suggestions and tailored projects
      </p>
      <h2 id="custom-request-heading" class="mt-2 text-2xl font-bold text-foreground">
        Tell me what you need
      </h2>
      <p class="mt-3 leading-7 text-muted-foreground">
        Choose whether you are suggesting an improvement to the free tool or asking about a specific
        project. No account is needed. Your message and reply address will be sent by email and will
        not be saved in the application.
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
        Your request was sent. Thanks for getting in touch; I will review it and reply to your
        email.
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
        <legend class="text-sm font-semibold text-foreground">What would you like to do?</legend>
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
            Your name <span class="font-normal text-subtle-foreground">(optional)</span>
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
            Email address <span aria-hidden="true" class="text-red-700">*</span>
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
              Used only to reply to your request.
            </p>
          {/if}
        </div>

        <div>
          <label for="request-company" class="mb-1 block text-sm font-medium text-foreground">
            Company <span class="font-normal text-subtle-foreground">(optional)</span>
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
            What is it mostly about?
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
          What are you trying to do, and what do you need? <span
            aria-hidden="true"
            class="text-red-700">*</span
          >
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
            Please do not include passwords, shipment records, customer-confidential details, SSCCs,
            or GTINs.
          </p>
        {/if}
      </div>

      <div class="sr-only" aria-hidden="true">
        <label for="request-website">Leave this field empty</label>
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
          {submitting ? 'Sending…' : 'Send request'}
        </button>
        <p class="text-sm text-muted-foreground">
          Prefer email? <a
            href="mailto:jbolanosdiaz@gmail.com"
            onclick={() =>
              trackProductEvent('custom_contact_clicked', { placement: 'guide_email_fallback' })}
            class="font-medium text-blue-700 underline dark:text-blue-300">Contact me directly</a
          >.
        </p>
      </div>
    </form>
  </section>

  <aside
    class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-5 text-sm text-amber-950 dark:text-amber-100"
  >
    These layouts apply the supported baseline rules in this generator. Confirm your trading
    partner’s current requirements and physically verify printed barcode quality before operational
    use.
  </aside>
</div>
