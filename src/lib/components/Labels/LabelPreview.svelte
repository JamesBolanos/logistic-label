<!-- src/lib/components/Labels/LabelPreview.svelte -->
<script>
  import { onDestroy } from 'svelte';
  import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  import { createOperationId, trackProductEvent } from '#lib/analytics/client.ts';
  import { classifyHttpFailure } from '#lib/analytics/events.ts';
  import {
    getLabelSizeForPrintLayout,
    getTemplateVersionForLabelType
  } from '#lib/labels/workflows.js';
  import {
    LABEL_VERIFICATION_HEADER,
    parseLabelVerificationReport
  } from '#lib/labels/verification.js';

  // Props
  let { labelData = null, previewUrl = $bindable(null) } = $props();

  // State
  let isLoading = $state(false);
  let error = $state(null);
  let verification = $state(null);
  let objectUrl = null;
  let locale = $derived(getLocale());

  const previewAspectRatio = $derived.by(() => {
    const labelSize = labelData ? getLabelSizeForPrintLayout(labelData.print_layout) : '4x6';
    if (labelSize === '4x3') return '4 / 3';
    if (labelSize === '6x8') return '3 / 4';
    return '2 / 3';
  });

  onDestroy(() => {
    revokePreviewUrl();
  });

  // Watch for changes in labelData
  $effect(() => {
    if (!labelData || previewUrl) return;
    generatePreview();
  });

  // Generate a preview of the label
  async function generatePreview() {
    if (!labelData) return;

    const startedAt = Date.now();
    let responseStatus = null;

    isLoading = true;
    error = null;
    verification = null;

    try {
      // Call the API to generate a preview
      const response = await fetch(localizeHref('/api/pdf/preview', { locale }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Operation-ID': createOperationId()
        },
        body: JSON.stringify(labelData)
      });
      responseStatus = response.status;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || m.preview_failed());
      }

      verification = parseLabelVerificationReport(response.headers.get(LABEL_VERIFICATION_HEADER));
      const pdf = await response.blob();
      revokePreviewUrl();
      objectUrl = URL.createObjectURL(pdf);
      previewUrl = `${objectUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
      trackProductEvent('label_preview_succeeded', {
        label_type: labelData.label_type,
        label_size: getLabelSizeForPrintLayout(labelData.print_layout),
        template_version: getTemplateVersionForLabelType(labelData.label_type),
        duration_ms: Date.now() - startedAt
      });
    } catch (err) {
      console.error('Preview generation error:', err);
      error = err.message || m.preview_error_generating();
      trackProductEvent('workflow_failed', {
        step: 'label_preview',
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
    } finally {
      isLoading = false;
    }
  }

  function revokePreviewUrl() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">{m.preview_step3()}</p>
  <h3 class="mt-1 text-lg font-bold mb-4">{m.preview_review_label()}</h3>

  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
      <p>{m.preview_error_prefix()} {error}</p>
      <button onclick={generatePreview} class="mt-2 text-sm text-blue-600 hover:text-blue-500">
        {m.preview_try_again()}
      </button>
    </div>
  {:else if previewUrl}
    <div class="flex justify-center rounded-md border border-gray-300 bg-gray-100 p-4">
      <iframe
        src={previewUrl}
        title={m.preview_label_preview()}
        class="w-full max-w-sm rounded-md bg-white shadow-sm"
        style={`aspect-ratio: ${previewAspectRatio};`}
      ></iframe>
    </div>
    <div class="mt-4 text-sm text-gray-500">
      <p>
        {m.preview_uses_next_sscc()}
      </p>
    </div>
    {#if verification}
      <section
        class="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
        aria-labelledby="automated-label-checks-heading"
      >
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            aria-hidden="true"
          >
            ✓
          </div>
          <div>
            <h4 id="automated-label-checks-heading" class="font-semibold text-emerald-950">
              {m.preview_automated_checks()}
            </h4>
            <p class="mt-1 text-sm text-emerald-900">
              {m.preview_passed_checks()}
            </p>
          </div>
        </div>

        <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt class="font-medium text-gray-600">{m.preview_label_type()}</dt>
            <dd class="mt-1 text-gray-950">{verification.labelType}</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-600">{m.preview_print_layout()}</dt>
            <dd class="mt-1 text-gray-950">{verification.printLayout}</dd>
          </div>
          <div>
            <dt class="font-medium text-gray-600">{m.preview_barcode_data()}</dt>
            <dd class="mt-1 text-gray-950">
              {verification.symbology}: {verification.applicationIdentifiers
                .map((ai) => `(${ai})`)
                .join(', ')}
            </dd>
          </div>
        </dl>

        <ul class="mt-4 space-y-2 text-sm">
          {#each verification.checks as check (check.id)}
            <li class="flex items-start gap-2 text-gray-800">
              <span class={check.passed ? 'text-emerald-700' : 'text-red-700'} aria-hidden="true">
                {check.passed ? '✓' : '×'}
              </span>
              <span>{check.label}</span>
            </li>
          {/each}
        </ul>

        <div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p class="font-semibold">{m.preview_physical_verification()}</p>
          <ul class="mt-1 list-disc space-y-1 pl-5">
            {#each verification.warnings as warning (warning)}
              <li>{warning}</li>
            {/each}
          </ul>
        </div>
        <p class="mt-3 text-xs text-gray-600">
          These automated checks are not a GS1 verification certificate.
        </p>
      </section>
    {/if}
  {:else}
    <div
      class="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="mt-2 text-gray-500">{m.preview_review_scenario()}</p>
    </div>
  {/if}
</div>
