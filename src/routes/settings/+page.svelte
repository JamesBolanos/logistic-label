<script>
  let exporting = false;
  let message = '';

  async function exportData() {
    if (exporting) return;
    exporting = true;
    message = '';

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
      message = 'Data exported successfully.';
    } catch (err) {
      console.error(err);
      message = 'Failed to export data. Please try again.';
    } finally {
      exporting = false;
    }
  }
</script>

<svelte:head>
  <title>Settings | Logistic Label</title>
</svelte:head>

<main class="settings-page">
  <header class="page-header">
    <h1>Settings</h1>
    <p>Manage your account and export your data.</p>
  </header>

  <section class="card">
    <header class="card-header">
      <div>
        <h2>Data Export</h2>
        <p>Download all of your data as an Excel file for your records.</p>
      </div>
    </header>
    <div class="card-body">
      <p>
        This export includes your account information, company settings (including GS1 company
        prefix), and every label you've created in the system.
      </p>
      <button class="export-button" on:click={exportData} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Download all my data (.XLSX)'}
      </button>
      {#if message}
        <p class="message">{message}</p>
      {/if}
    </div>
  </section>
</main>

<style>
  .settings-page {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .page-header h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
  }

  .page-header p {
    margin: 0;
    color: #4b5563;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem 1.5rem 0;
  }

  .card-header h2 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
  }

  .card-header p {
    margin: 0;
    color: #4b5563;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.5rem 1.5rem;
  }

  .card-body p {
    margin: 0;
    color: #1f2937;
    line-height: 1.6;
  }

  .export-button {
    align-self: flex-start;
    background: #1f2937;
    color: #ffffff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
    cursor: pointer;
    transition: opacity 150ms ease-in-out;
  }

  .export-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-button:not(:disabled):hover {
    opacity: 0.9;
  }

  .message {
    color: #1f2937;
  }
</style>
