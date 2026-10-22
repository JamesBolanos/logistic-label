<script>
  import LabelHistory from '#lib/components/Labels/LabelHistory.svelte';
  import DataExport from '#lib/components/Settings/DataExport.svelte';
</script>

<svelte:head>
  <title>Saved Labels - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Review your saved labels, download PDF or ZPL copies, print via the bridge, and export your data."
  />
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Saved Labels</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Review every label you have created, download a PDF or ZPL copy, print through the bridge, and
      export a copy of your data.
    </p>
  </div>

  <LabelHistory />

  <DataExport />
</div>
