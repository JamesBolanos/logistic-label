<script>
  import { localizeHref } from '#lib/paraglide/runtime.js';
  import { m } from '#lib/paraglide/messages.js';
  let exporting = $state(false);
  let exportMessage = $state('');

  async function exportData() {
    if (exporting) return;
    exporting = true;
    exportMessage = '';

    try {
      const response = await fetch(localizeHref('/api/export/excel'));
      if (!response.ok) {
        throw new Error(m.export_failed_error());
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
      exportMessage = m.data_export_success();
    } catch (err) {
      console.error(err);
      exportMessage = m.data_export_failed();
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
    <h2 id="data-export-heading" class="text-xl font-semibold text-foreground">
      {m.data_export_title()}
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">
      {m.data_export_desc()}
    </p>
  </div>
  <p class="text-sm leading-6 text-muted-foreground">
    {m.data_export_details()}
  </p>
  <div>
    <button
      type="button"
      onclick={exportData}
      disabled={exporting}
      class="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
    >
      {exporting ? m.data_exporting() : m.data_export_button()}
    </button>
    {#if exportMessage}
      <p class="mt-2 text-sm text-muted-foreground" role="status">{exportMessage}</p>
    {/if}
  </div>
</section>
