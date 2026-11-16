<script>
  import DataExport from '#lib/components/Settings/DataExport.svelte';
  import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.export_page_title()} - GS1-128 Logistic Label Generator</title>
  <meta name="description" content={m.export_page_meta()} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">{m.export_page_heading()}</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      {m.export_page_desc()}
    </p>
  </div>

  <DataExport />
</div>
