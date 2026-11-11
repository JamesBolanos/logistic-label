<script>
  import { getLabelSizeForPrintLayout, LABEL_TYPES, PRINT_LAYOUTS } from '#lib/labels/workflows.js';

  let { labelType, printLayout } = $props();
  let isTransport = $derived(labelType === LABEL_TYPES.SSCC_ONLY);
  let isBasic = $derived(labelType === LABEL_TYPES.SSCC_BASIC);
  let labelSize = $derived(getLabelSizeForPrintLayout(printLayout).replace('x', ' × '));
  let isCompact = $derived(printLayout === PRINT_LAYOUTS.FOUR_BY_THREE_SINGLE);
</script>

<figure class="mx-auto w-full max-w-xs">
  <p class="mb-2 rounded bg-red-700 px-2 py-1 text-center text-xs font-bold text-white">
    DEMO — NOT VALID FOR SHIPPING
  </p>
  <div
    class={`${isCompact ? 'aspect-4/3' : 'aspect-2/3'} overflow-hidden border border-gray-900 bg-white p-2 text-gray-950`}
    data-print-layout={printLayout}
    data-label-size={labelSize}
    role="img"
    aria-label={`Static ${labelSize} app-layout sample. Not valid for shipping. Barcode placeholders are non-scannable.`}
  >
    {#if isBasic}
      <div class="flex h-full flex-col border border-gray-900 text-[10px] leading-tight">
        <div class="h-1/3 border-b border-gray-900 px-2 pt-2">
          <strong class="block">SSCC</strong>
          <span class="mt-2 block text-center text-sm font-bold">[SSCC]</span>
        </div>
        <div class="flex min-h-0 flex-1 flex-col items-center justify-end px-2 pb-2">
          <div class="barcode-placeholder min-h-0 flex-1">NON-SCANNABLE BARCODE</div>
          <div class="mt-1 text-center">(00) [SSCC]</div>
        </div>
      </div>
    {:else if isTransport}
      <div class="flex h-full flex-col border border-gray-900 text-[9px] leading-tight">
        <div class="grid h-[20%] grid-cols-2 border-b border-gray-900">
          <div class="border-r border-gray-900 p-2">
            <strong class="block">SHIP FROM</strong>
            Example Supplier<br />Origin address
          </div>
          <div class="p-2">
            <strong class="block">SHIP TO</strong>
            Example Distribution<br />Destination address
          </div>
        </div>
        <div class="h-[14%] border-b border-gray-900 p-2">
          <strong class="block">PO NUMBER</strong>
          [EXAMPLE PO]
        </div>
        <div class="h-[12%] border-b border-gray-900 p-2">
          <strong class="block">CARRIER</strong>
          [EXAMPLE CARRIER]
        </div>
        <div class="grid h-[12%] grid-cols-2 border-b border-gray-900">
          <div class="border-r border-gray-900 p-2">
            <strong class="block">GROSS WEIGHT</strong>
            [WEIGHT]
          </div>
          <div class="p-2">
            <strong class="block">COUNT</strong>
            [COUNT]
          </div>
        </div>
        <div class="flex min-h-0 flex-1 flex-col items-center justify-end p-2">
          <strong class="mb-1">SSCC</strong>
          <span class="mb-2 font-bold">[SSCC]</span>
          <div class="barcode-placeholder min-h-0 flex-1">NON-SCANNABLE BARCODE</div>
          <div class="mt-1 text-center">(00) [SSCC]</div>
        </div>
      </div>
    {:else}
      <div class="flex h-full flex-col border border-gray-900 text-[9px] leading-tight">
        <div class="grid h-[17%] grid-cols-2 border-b border-gray-900">
          <div class="border-r border-gray-900 p-2">
            <strong class="block">SHIP FROM</strong>
            Example Supplier<br />Origin address
          </div>
          <div class="p-2">
            <strong class="block">SHIP TO</strong>
            Customer DC<br />Destination address
          </div>
        </div>

        <div class="grid h-[8%] grid-cols-2 border-b border-gray-900">
          <div class="col-span-2 p-2">
            <strong class="mr-2">PO NUMBER</strong>
            [EXAMPLE PO]
          </div>
        </div>
        <div class="grid h-[9%] grid-cols-2 border-b border-gray-900">
          <div class="border-r border-gray-900 p-2">
            <strong class="block">CARRIER</strong>
            [EXAMPLE CARRIER]
          </div>
          <div class="p-2">
            <strong class="block">GROSS WEIGHT</strong>
            [WEIGHT]
          </div>
        </div>
        <div class="grid h-[9%] grid-cols-2 border-b border-gray-900">
          <div class="border-r border-gray-900 p-2">
            <strong class="block">CONTENT</strong>
            [YOUR GTIN]
          </div>
          <div class="p-2">
            <strong class="block">COUNT</strong>
            [YOUR COUNT]
          </div>
        </div>
        <div
          class="flex h-[27%] min-h-0 flex-col items-center justify-end px-2 py-1"
        >
          <div class="barcode-placeholder min-h-0 flex-1">NON-SCANNABLE CONTENT BARCODE</div>
          <div class="mt-1 text-center">(02) [GTIN] (37) [COUNT]</div>
        </div>
        <div class="flex h-[27%] min-h-0 flex-col items-center justify-end px-2 py-1">
          <div class="barcode-placeholder min-h-0 flex-1">NON-SCANNABLE SSCC BARCODE</div>
          <div class="mt-1 text-center">(00) [SSCC]</div>
        </div>
      </div>
    {/if}
  </div>
  <figcaption class="mt-2 text-center text-xs text-muted-foreground">
    App layout: {labelSize} in · single label. Barcode placeholders are intentionally non-scannable.
  </figcaption>
</figure>

<style>
  .barcode-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: 1px dashed #111827;
    background: #f3f4f6;
    padding: 0.25rem;
    text-align: center;
    font-size: 8px;
    font-weight: 700;
    color: #111827;
  }
</style>
