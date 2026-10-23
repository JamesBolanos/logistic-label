<script>
  import SavedProducts from '#lib/components/Labels/SavedProducts.svelte';
</script>

<svelte:head>
  <title>Products - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Save the products you ship often with their GTINs, then select one when creating a label."
  />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-foreground">Products</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Keep the products you ship often with their GTINs. When creating a label, select a product to
      fill its GTIN; shipment details such as lot, date, count, and addresses stay on each label.
    </p>
  </div>

  <SavedProducts />
</div>
