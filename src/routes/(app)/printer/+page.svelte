<script>
  import PrintBridgeSettings from '#lib/components/Labels/PrintBridgeSettings.svelte';
</script>

<svelte:head>
  <title>Printer Config - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Configure the print bridge and LAN printer used to send saved labels to a network printer."
  />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Printer Config</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Configure the print bridge and the network printer that receives saved labels sent from the
      Saved Labels page.
    </p>
  </div>

  <PrintBridgeSettings />
</div>
