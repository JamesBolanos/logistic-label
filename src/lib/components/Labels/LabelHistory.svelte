<script>
  import { onMount } from 'svelte';
  import { createOperationId, trackProductEvent } from '$lib/analytics/client.js';
  import { classifyHttpFailure } from '$lib/analytics/events.js';
  import {
    getLabelTypeName,
    getHomogeneousDateOption,
    getPackagingLevelName,
    getPrintLayoutName,
    LABEL_TYPES
  } from '$lib/labels/workflows.js';

  let labels = $state([]);
  let isLoading = $state(true);
  let error = $state(null);
  let currentPage = $state(1);
  let totalPages = $state(1);
  let searchTerm = $state('');

  onMount(() => fetchLabels());

  async function fetchLabels(page = 1, search = '') {
    isLoading = true;
    error = null;

    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);

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

  function handleSearch() {
    fetchLabels(1, searchTerm);
  }

  function changePage(page) {
    if (page < 1 || page > totalPages) return;
    fetchLabels(page, searchTerm);
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  function formatTraceabilityDate(dateAi, dateValue) {
    const option = getHomogeneousDateOption(dateAi);
    if (!option || !dateValue) return '';
    return `${option.label}: ${dateValue}`;
  }

  async function downloadLabel(id) {
    const startedAt = Date.now();
    let responseStatus = null;

    try {
      const response = await fetch(`/api/pdf/download/${id}`, {
        headers: {
          'X-Operation-ID': createOperationId(),
          'X-Download-Source': 'history'
        }
      });
      responseStatus = response.status;

      if (!response.ok) throw new Error('Failed to download label');

      const blob = await response.blob();
      trackProductEvent('pdf_response_succeeded', {
        format: 'pdf',
        source: 'history',
        duration_ms: Date.now() - startedAt
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `label_${id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      trackProductEvent('pdf_download_started', { format: 'pdf', source: 'history' });
    } catch (err) {
      console.error('Error downloading label:', err);
      trackProductEvent('workflow_failed', {
        step: 'pdf_download',
        error_category: responseStatus === null ? 'network' : classifyHttpFailure(responseStatus),
        duration_ms: Date.now() - startedAt
      });
      error = err.message || 'Failed to download label';
    }
  }
</script>

<div class="rounded-lg bg-white p-6 shadow-md">
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-xl font-bold">Saved labels</h3>
      <p class="mt-1 text-sm text-gray-500">Existing records keep their original label version.</p>
    </div>
    <div class="flex max-w-md flex-1">
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search by SSCC, GTIN, or lot..."
        class="min-w-0 flex-grow rounded-l-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onkeyup={(event) => event.key === 'Enter' && handleSearch()}
      />
      <button
        type="button"
        onclick={handleSearch}
        class="rounded-r-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Search
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="flex h-40 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
    </div>
  {:else if error}
    <div class="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
      <p>{error}</p>
      <button
        type="button"
        onclick={() => fetchLabels(currentPage, searchTerm)}
        class="mt-2 text-sm text-blue-600 hover:text-blue-500"
      >
        Try again
      </button>
    </div>
  {:else if labels.length === 0}
    <div class="rounded-md bg-gray-50 p-8 text-center text-gray-500">
      No labels found. Create a label to see it here.
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Type
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              SSCC
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Details
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Created
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          {#each labels as label (label.id)}
            <tr>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-700">
                <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
                  {getLabelTypeName(label.label_type)}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 font-mono text-sm font-medium text-gray-900">
                {label.sscc}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {#if label.label_type === LABEL_TYPES.HOMOGENEOUS_UNIT}
                  <div>
                    {label.quantity}
                    {getPackagingLevelName(label.packaging_level, label.quantity)}
                  </div>
                  <div class="mt-1 font-mono text-xs">GTIN {label.gtin}</div>
                  {#if label.lot_number}
                    <div class="mt-1 text-xs">Lot: {label.lot_number}</div>
                  {/if}
                  {#if label.date_ai && label.date_value}
                    <div class="mt-1 text-xs">
                      {formatTraceabilityDate(label.date_ai, label.date_value)}
                    </div>
                  {/if}
                {:else if label.label_type === LABEL_TYPES.SSCC_ONLY}
                  <div>Logistic unit identifier; contents are not encoded</div>
                  <div class="mt-1 text-xs">{getPrintLayoutName(label.print_layout)}</div>
                {:else}
                  <div>GTIN {label.gtin || 'Unavailable'}</div>
                  {#if label.lot_number}<div class="mt-1 text-xs">Lot {label.lot_number}</div>{/if}
                {/if}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                {formatDate(label.created_at)}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                <button
                  type="button"
                  onclick={() => downloadLabel(label.id)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Download
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if totalPages > 1}
      <div class="mt-4 flex items-center justify-between border-t border-gray-200 px-2 py-3">
        <p class="text-sm text-gray-700">Page {currentPage} of {totalPages}</p>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onclick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>
