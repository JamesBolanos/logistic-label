<script>
  import { LABEL_TYPES } from '$lib/labels/workflows.js';

  let { labelType } = $props();
  let isTransport = $derived(labelType === LABEL_TYPES.SSCC_ONLY);
</script>

<figure class="mx-auto w-full max-w-xs">
  <div
    class="aspect-[2/3] overflow-hidden rounded-lg border-2 border-gray-800 bg-white p-2 text-gray-950 shadow-sm"
  >
    <div class="grid h-full grid-rows-[auto_auto_auto_1fr] border border-gray-700">
      <div class="grid grid-cols-2 border-b border-gray-700 text-[9px] leading-tight">
        <div class="border-r border-gray-700 p-2">
          <strong class="block">SHIP FROM</strong>
          Example Supplier<br />Origin address
        </div>
        <div class="p-2">
          <strong class="block">SHIP TO</strong>
          Customer DC<br />Destination address
        </div>
      </div>

      <div class="grid grid-cols-2 border-b border-gray-700 text-[9px]">
        <div class="border-r border-gray-700 p-2"><strong>PO</strong><br />PO-100</div>
        <div class="p-2"><strong>CARRIER</strong><br />Example Freight</div>
      </div>

      {#if isTransport}
        <div class="grid grid-cols-2 border-b border-gray-700 text-[9px]">
          <div class="border-r border-gray-700 p-2"><strong>GROSS WEIGHT</strong><br />500 kg</div>
          <div class="p-2"><strong>COUNT</strong><br />12 Cartons</div>
        </div>
      {:else}
        <div class="border-b border-gray-700 p-2 text-[9px]">
          <div class="grid grid-cols-2 gap-2">
            <span><strong>CONTENT GTIN</strong><br />00012345600012</span>
            <span><strong>COUNT</strong><br />120 Each</span>
          </div>
          <div class="mt-2 h-8 barcode-pattern" aria-hidden="true"></div>
          <div class="mt-1 text-center">(02) 00012345600012 (37) 120</div>
        </div>
      {/if}

      <div class="flex flex-col justify-end p-3 text-[9px]">
        {#if !isTransport}
          <div class="mb-3 border border-dashed border-gray-400 p-1 text-center text-gray-600">
            Optional lot/date barcode on the 6 × 8 layout
          </div>
        {/if}
        <strong class="mb-1 text-center text-[10px]">SSCC</strong>
        <div class="h-14 barcode-pattern" aria-hidden="true"></div>
        <div class="mt-1 text-center">(00) 0 0123456 000000001 8</div>
      </div>
    </div>
  </div>
  <figcaption class="mt-2 text-center text-xs text-gray-500">
    Simplified layout preview—not to scale
  </figcaption>
</figure>

<style>
  .barcode-pattern {
    background: repeating-linear-gradient(
      90deg,
      #111827 0,
      #111827 2px,
      transparent 2px,
      transparent 4px,
      #111827 4px,
      #111827 5px,
      transparent 5px,
      transparent 8px
    );
  }
</style>
