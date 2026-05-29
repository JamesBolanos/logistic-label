<!-- src/lib/components/Labels/LabelHistory.svelte -->
<script>
    import { onMount } from 'svelte';
    
    // State
    let labels = $state([]);
    let isLoading = $state(true);
    let error = $state(null);
    let currentPage = $state(1);
    let totalPages = $state(1);
    let searchTerm = $state('');
    
    // Load labels on mount
    onMount(() => {
      fetchLabels();
    });
    
    // Fetch labels from API
    async function fetchLabels(page = 1, search = '') {
      isLoading = true;
      error = null;
      
      try {
        // Construct query params
        const params = new URLSearchParams({
          page,
          limit: 10
        });
        
        if (search) {
          params.append('search', search);
        }
        
        // Call API
        const response = await fetch(`/api/labels/list?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch labels');
        }
        
        const data = await response.json();
        labels = data.labels;
        currentPage = data.pagination.page;
        totalPages = data.pagination.pages;
      } catch (err) {
        console.error('Error fetching labels:', err);
        error = err.message || 'Error loading labels';
        labels = [];
      } finally {
        isLoading = false;
      }
    }
    
    // Handle page change
    function changePage(page) {
      if (page < 1 || page > totalPages) return;
      currentPage = page;
      fetchLabels(page, searchTerm);
    }
    
    // Handle search
    function handleSearch() {
      currentPage = 1;
      fetchLabels(1, searchTerm);
    }
    
    function formatProductionDate(dateString) {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return dateString || '';
      return date.toLocaleDateString();
    }
    
    // Download a label PDF
    async function downloadLabel(id) {
      try {
        // Get the PDF
        const response = await fetch(`/api/pdf/download/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to download label');
        }
        
        // Create a blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `label_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading label:', err);
        alert('Failed to download label: ' + err.message);
      }
    }
    
    // Delete a label
    async function deleteLabel(id) {
      if (!confirm('Are you sure you want to delete this label?')) return;
      
      try {
        const response = await fetch(`/api/labels/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete label');
        }
        
        // Refresh the list
        fetchLabels(currentPage, searchTerm);
      } catch (err) {
        console.error('Error deleting label:', err);
        alert('Failed to delete label: ' + err.message);
      }
    }
  </script>
  
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-bold mb-6">Label History</h3>
    
    <!-- Search Bar -->
    <div class="mb-6">
      <div class="flex">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search by GTIN, lot number, or SSCC..."
          class="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onkeyup={(event) => event.key === 'Enter' && handleSearch()}
        />
        <button
          onclick={handleSearch}
          class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </div>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center items-center h-40">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <p>Error: {error}</p>
        <button 
          onclick={() => fetchLabels(currentPage, searchTerm)}
          class="mt-2 text-sm text-blue-600 hover:text-blue-500"
        >
          Try again
        </button>
      </div>
    {:else if labels.length === 0}
      <div class="text-center p-8 bg-gray-50 rounded-md">
        <p class="text-gray-500">No labels found. Create a new label to see it here.</p>
      </div>
    {:else}
      <!-- Labels Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SSCC Number
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GTIN
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Production Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each labels as label (label.id)}
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {label.sscc}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {label.gtin}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatProductionDate(label.production_date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {label.quantity}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {label.weight_pounds} lb
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      onclick={() => downloadLabel(label.id)}
                      class="text-blue-600 hover:text-blue-900"
                    >
                      Download
                    </button>
                    <button
                      onclick={() => deleteLabel(label.id)}
                      class="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-between py-3 px-2 mt-4 border-t border-gray-200">
          <div>
            <p class="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </p>
          </div>
          <div class="flex space-x-2">
            <button
              onclick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onclick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
