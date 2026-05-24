<!-- src/lib/components/Labels/LabelPreview.svelte -->
<script>
    // Props
    let { labelData = null, previewUrl = $bindable(null) } = $props();
    
    // State
    let isLoading = $state(false);
    let error = $state(null);
    
    // Watch for changes in labelData
    $effect(() => {
      if (!labelData || previewUrl) return;
      generatePreview();
    });
    
    // Generate a preview of the label
    async function generatePreview() {
      if (!labelData) return;
      
      isLoading = true;
      error = null;
      
      try {
        // Call the API to generate a preview
        const response = await fetch('/api/pdf/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(labelData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate preview');
        }
        
        // Get the preview URL
        const data = await response.json();
        previewUrl = data.previewUrl;
      } catch (err) {
        console.error('Preview generation error:', err);
        error = err.message || 'Error generating preview';
      } finally {
        isLoading = false;
      }
    }
  </script>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-lg font-bold mb-4">Label Preview</h3>
    
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>Error: {error}</p>
        <button 
          onclick={generatePreview}
          class="mt-2 text-sm text-blue-600 hover:text-blue-500"
        >
          Try again
        </button>
      </div>
    {:else if previewUrl}
      <div class="border border-gray-300 rounded-md overflow-hidden">
        <iframe 
          src={previewUrl} 
          title="Label Preview" 
          class="w-full h-96"
          sandbox="allow-scripts"
        ></iframe>
      </div>
      <div class="mt-4 text-sm text-gray-500">
        <p>
          Note: This is a preview of how your label will appear. The actual printed label
          may vary slightly depending on your printer settings.
        </p>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2 text-gray-500">Fill out the form to see a preview of your GS1-128 label</p>
      </div>
    {/if}
  </div>
