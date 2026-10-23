<script>
  let exporting = $state(false);
  let exportMessage = $state('');

  async function exportData() {
    if (exporting) return;
    exporting = true;
    exportMessage = '';

    try {
      const response = await fetch('/api/export/excel');
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      let filename = 'logistic-label-data.xlsx';
      const match = contentDisposition.match(/filename="([^"]+)"/);
      if (match?.[1]) {
        filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      exportMessage = 'Data exported successfully.';
    } catch (err) {
      console.error(err);
      exportMessage = 'Failed to export data. Please try again.';
    } finally {
      exporting = false;
    }
  }
</script>

<section
  aria-labelledby="data-export-heading"
  class="space-y-4 rounded-lg border border-border-default bg-surface p-6 shadow"
>
  <div>
    <h2 id="data-export-heading" class="text-xl font-semibold text-foreground">Data Export</h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Download all of your data as an Excel file for your records.
    </p>
  </div>
  <p class="text-sm leading-6 text-muted-foreground">
    This export includes your account information, company settings (including GS1 company prefix),
    and every label you've created in the system.
  </p>
  <div>
    <button
      type="button"
      onclick={exportData}
      disabled={exporting}
      class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
    >
      {exporting ? 'Exporting...' : 'Download all my data (.XLSX)'}
    </button>
    {#if exportMessage}
      <p class="mt-2 text-sm text-muted-foreground" role="status">{exportMessage}</p>
    {/if}
  </div>
</section>
