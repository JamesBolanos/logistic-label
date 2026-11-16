<script>
  import SavedProducts from '#lib/components/Labels/SavedProducts.svelte';
  import { m } from '#lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>{m.products_title()} - GS1-128 Logistic Label Generator</title>
  <meta name="description" content={m.products_meta()} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">{m.products_heading()}</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      {m.products_desc()}
    </p>
  </div>

  <SavedProducts />
</div>
