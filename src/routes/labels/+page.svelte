<!-- src/routes/labels/+page.svelte -->
<script>
    import { onMount } from 'svelte';
    import ProtectedRoute from '$lib/components/Layout/ProtectedRoute.svelte';
    import LabelForm from '$lib/components/Labels/LabelForm.svelte';
    import LabelPreview from '$lib/components/Labels/LabelPreview.svelte';
    import LabelHistory from '$lib/components/Labels/LabelHistory.svelte';
    
    // State
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
    
    // Handle form submission
    async function handleSubmit(formData) {
      labelData = formData;
      success = null;
      error = null;
      previewUrl = null;
    }
    
    // Generate PDF
    async function generatePDF() {
      if (!labelData) return;
      
      isGenerating = true;
      error = null;
      success = null;
      
      try {
        const response = await fetch('/api/pdf/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(labelData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate label');
        }
        
        const data = await response.json();
        generatedLabelId = data.labelId;
        
        const pdfResponse = await fetch(`/api/pdf/download/${generatedLabelId}`);

        if (!pdfResponse.ok) {
          throw new Error('Label was saved, but the PDF download failed');
        }

        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `gs1_label_${generatedLabelId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        
        historyVersion += 1;
        success = 'Label generated successfully and saved to history.';
      } catch (err) {
        console.error('PDF generation error:', err);
        error = err.message || 'Error generating label';
      } finally {
        isGenerating = false;
      }
    }
  </script>
  
  <svelte:head>
    <title>Create Labels - GS1-128 Logistic Label Generator</title>
    <meta name="description" content="Generate GS1-128 logistic labels for shipping and inventory." />
  </svelte:head>
  
  <ProtectedRoute>
    <div class="space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Generate Logistic Labels</h1>

      {#if settingsError}
        <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {settingsError}
        </div>
      {:else if settings && !settings.is_configured}
        <div class="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
          Configure your GS1 Company Prefix in
          <a href="/settings" class="font-medium text-blue-600 hover:text-blue-500">Settings</a>
          before previewing or generating labels.
        </div>
      {/if}
      
      {#if error}
        <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      {/if}
      
      {#if success}
        <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
        </div>
      {/if}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Label Form -->
        <div>
          <LabelForm onsubmit={handleSubmit} />
        </div>
        
        <!-- Label Preview -->
        <div>
          <LabelPreview {labelData} bind:previewUrl />
          
          {#if labelData && previewUrl}
            <div class="mt-4">
              <button
                onclick={generatePDF}
                disabled={isGenerating}
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {#if isGenerating}
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                {:else}
                  Generate PDF Label
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Label History -->
      <div class="mt-12">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Label History</h2>
        {#key historyVersion}
          <LabelHistory />
        {/key}
      </div>
    </div>
  </ProtectedRoute>
