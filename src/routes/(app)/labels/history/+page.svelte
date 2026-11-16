<script>
  import LabelHistory from '#lib/components/Labels/LabelHistory.svelte';
  import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.history_title()} - GS1-128 Logistic Label Generator</title>
  <meta name="description" content={m.history_meta()} />
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">{m.history_heading()}</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      {m.history_desc()}
    </p>
  </div>

  <LabelHistory />
</div>
