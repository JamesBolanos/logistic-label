<script>
  import { onMount } from 'svelte';
  import ProtectedRoute from '$lib/components/Layout/ProtectedRoute.svelte';
  import LabelWorkflowSelector from '$lib/components/Labels/LabelWorkflowSelector.svelte';
  import LabelForm from '$lib/components/Labels/LabelForm.svelte';
  import LabelPreview from '$lib/components/Labels/LabelPreview.svelte';
  import LabelHistory from '$lib/components/Labels/LabelHistory.svelte';
  import { createOperationId, trackProductEvent } from '$lib/analytics/client.js';
  import { classifyHttpFailure } from '$lib/analytics/events.js';
  import { CURRENT_TEMPLATE_VERSION, getLabelSizeForPrintLayout } from '$lib/labels/workflows.js';

  let selectedLabelType = $state(null);
  let labelData = $state(null);
  let previewUrl = $state(null);
  let generatedLabelId = $state(null);
  let isGenerating = $state(false);
  let error = $state(null);
  let success = $state(null);
  let settings = $state(null);
  let settingsError = $state(null);
  let historyVersion = $state(0);

  onMount(loadSettings);

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
        template_version: CURRENT_TEMPLATE_VERSION,
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

      historyVersion += 1;
      success = 'Label generated successfully and saved to history.';
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
  <title>Guided Logistic Label Generator</title>
  <meta
    name="description"
    content="Choose an explicit logistic-label scenario and generate a guided GS1-128 PDF label."
  />
</svelte:head>

<ProtectedRoute>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Guided Logistic Label Generator</h1>
      <p class="mt-2 text-sm text-gray-600">
        Choose the scenario first, then review exactly what the barcode will communicate.
      </p>
    </div>

    {#if settingsError}
      <div class="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
        {settingsError}
      </div>
    {:else if settings && !settings.is_configured}
      <div class="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
        Configure your GS1 Company Prefix in
        <a href="/settings" class="font-medium text-blue-600 hover:text-blue-500">Settings</a>
        before previewing or generating labels.
      </div>
    {/if}

    {#if error}
      <div class="rounded-md border border-red-400 bg-red-100 p-4 text-red-700">{error}</div>
    {/if}

    {#if success}
      <div class="rounded-md border border-green-400 bg-green-100 p-4 text-green-700">
        {success}
      </div>
    {/if}

    {#if !selectedLabelType}
      <LabelWorkflowSelector onselect={selectWorkflow} />
    {:else}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          {#key selectedLabelType}
            <LabelForm
              labelType={selectedLabelType}
              onsubmit={handleSubmit}
              onback={changeWorkflow}
            />
          {/key}
        </div>

        <div>
          <LabelPreview {labelData} bind:previewUrl />

          {#if labelData && previewUrl}
            <div class="mt-4">
              <button
                onclick={generatePDF}
                disabled={isGenerating}
                class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isGenerating ? 'Generating PDF...' : 'Generate and save label'}
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <div class="mt-12">
      <h2 class="mb-4 text-xl font-bold text-gray-900">Label History</h2>
      {#key historyVersion}
        <LabelHistory />
      {/key}
    </div>
  </div>
</ProtectedRoute>
