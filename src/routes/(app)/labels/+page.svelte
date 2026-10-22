<script>
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import LabelWorkflowSelector from '#lib/components/Labels/LabelWorkflowSelector.svelte';
  import LabelForm from '#lib/components/Labels/LabelForm.svelte';
  import LabelPreview from '#lib/components/Labels/LabelPreview.svelte';
  import { createOperationId, trackProductEvent } from '#lib/analytics/client.ts';
  import { classifyHttpFailure } from '#lib/analytics/events.ts';
  import {
    getLabelSizeForPrintLayout,
    getTemplateVersionForLabelType,
    isSupportedLabelType
  } from '#lib/labels/workflows.js';

  // A public guide can deep-link to a supported workflow. Unsupported values
  // still fall back to the selector instead of creating an ambiguous draft.
  const requestedLabelType = page.url.searchParams.get('type');
  let selectedLabelType = $state(
    isSupportedLabelType(requestedLabelType) ? requestedLabelType : null
  );
  let labelData = $state(null);
  let previewUrl = $state(null);
  let generatedLabelId = $state(null);
  let isGenerating = $state(false);
  let error = $state(null);
  let success = $state(null);
  let settings = $state(null);
  let settingsError = $state(null);
  let products = $state([]);

  onMount(() => {
    loadSettings();
    loadProducts();
  });

  async function loadSettings() {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load label settings');
      }

      settings = data.settings;
    } catch (err) {
      settingsError = err.message || 'Failed to load label settings';
    }
  }

  // Saved products are optional convenience data. A failure must never block
  // label creation, so it stays silent and the form keeps manual GTIN entry.
  async function loadProducts() {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) return;
      const data = await response.json();
      products = data.products || [];
    } catch {
      products = [];
    }
  }

  function selectWorkflow(labelType) {
    selectedLabelType = labelType;
    resetDraft();
  }

  function changeWorkflow() {
    selectedLabelType = null;
    resetDraft();
  }

  function resetDraft() {
    labelData = null;
    previewUrl = null;
    generatedLabelId = null;
    error = null;
    success = null;
  }

  async function handleSubmit(formData) {
    labelData = formData;
    success = null;
    error = null;
    previewUrl = null;
  }

  async function generatePDF() {
    if (!labelData) return;

    const startedAt = Date.now();
    let responseStatus = null;
    let workflowStep = 'label_save';

    isGenerating = true;
    error = null;
    success = null;

    try {
      const response = await fetch('/api/pdf/generate', {
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
        throw new Error(errorData.message || 'Failed to generate label');
      }

      const data = await response.json();
      generatedLabelId = data.labelId;

      trackProductEvent('label_saved', {
        label_type: labelData.label_type,
        label_size: getLabelSizeForPrintLayout(labelData.print_layout),
        template_version: getTemplateVersionForLabelType(labelData.label_type),
        duration_ms: Date.now() - startedAt
      });

      workflowStep = 'pdf_response';
      const pdfStartedAt = Date.now();
      const pdfResponse = await fetch(`/api/pdf/download/${generatedLabelId}`, {
        headers: {
          'X-Operation-ID': createOperationId(),
          'X-Download-Source': 'new_label'
        }
      });
      responseStatus = pdfResponse.status;

      if (!pdfResponse.ok) {
        throw new Error('Label was saved, but the PDF download failed');
      }

      const blob = await pdfResponse.blob();
      trackProductEvent('pdf_response_succeeded', {
        format: 'pdf',
        source: 'new_label',
        duration_ms: Date.now() - pdfStartedAt
      });

      workflowStep = 'pdf_download';
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `gs1_label_${generatedLabelId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      trackProductEvent('pdf_download_started', {
        format: 'pdf',
        source: 'new_label'
      });

      success =
        'Label generated successfully and saved to history. See Saved Labels to download or reprint it.';
    } catch (err) {
      console.error('PDF generation error:', err);
      error = err.message || 'Error generating label';
      trackProductEvent('workflow_failed', {
        step: workflowStep,
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
    } finally {
      isGenerating = false;
    }
  }
</script>

<svelte:head>
  <title>Shipping Label Solutions - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Choose the shipping situation that fits your operation and generate a guided GS1-128 PDF label."
  />
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Choose the label that fits your shipment</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Start with the business situation. We will show what the label identifies, what information
      you need, and what its barcodes communicate.
    </p>
  </div>

  {#if settingsError}
    <div
      class="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300"
    >
      {settingsError}
    </div>
  {:else if settings && !settings.is_configured}
    <div
      class="rounded-md border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/40 p-4 text-yellow-800 dark:text-yellow-200"
    >
      Configure your GS1 Company Prefix in
      <a
        href="/settings"
        class="font-medium text-blue-600 hover:text-blue-500 dark:hover:text-blue-400">Settings</a
      >
      before previewing or generating labels.
    </div>
  {/if}

  {#if error}
    <div
      class="rounded-md border border-red-400 bg-red-100 dark:bg-red-900/40 p-4 text-red-700 dark:text-red-300"
    >
      {error}
    </div>
  {/if}

  {#if success}
    <div
      class="rounded-md border border-green-400 bg-green-100 dark:bg-green-900/40 p-4 text-green-700 dark:text-green-300"
    >
      {success}
    </div>
  {/if}

  {#if !selectedLabelType}
    <LabelWorkflowSelector onselect={selectWorkflow} />
  {:else}
    <!--
      Split-pane generator: controls on the left, live thermal preview on the
      right. The panes stack on small screens so the preview stays reachable.
    -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div class="lg:sticky lg:top-24">
        {#key selectedLabelType}
          <LabelForm
            labelType={selectedLabelType}
            companyName={settings?.company_name || ''}
            {products}
            onsubmit={handleSubmit}
            onback={changeWorkflow}
          />
        {/key}
      </div>

      <div class="lg:sticky lg:top-24">
        <LabelPreview {labelData} bind:previewUrl />

        {#if labelData && previewUrl}
          <div class="mt-4">
            <button
              onclick={generatePDF}
              disabled={isGenerating}
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
            >
              {isGenerating ? 'Generating PDF...' : 'Generate and save label'}
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <div class="mt-12 rounded-lg border border-border-default bg-surface p-6 text-center shadow">
    <h2 class="text-xl font-bold text-foreground">Label saved</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Your saved labels, PDF/ZPL downloads, and printing live on the Saved Labels page.
    </p>
    <a
      href="/labels/history"
      class="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
    >
      Open Saved Labels
    </a>
  </div>
</div>
