<script>
  import { getLabelSizeForPrintLayout, LABEL_TYPES } from '#lib/labels/workflows.js';

  let { labelType, printLayout } = $props();
  let sample = $derived(
    labelType === LABEL_TYPES.SSCC_ONLY
      ? 'transport'
      : labelType === LABEL_TYPES.SSCC_BASIC
        ? 'basic'
        : 'contents'
  );
  let labelSize = $derived(getLabelSizeForPrintLayout(printLayout).replace('x', ' × '));
  let aspectRatio = $derived(
    labelSize === '4 × 3' ? '4 / 3' : labelSize === '6 × 8' ? '3 / 4' : '2 / 3'
  );
</script>

<figure class="mx-auto w-full max-w-xs">
  <iframe
    src={`/guide/samples/${sample}.pdf#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
    title={`Static app-generated ${labelSize} GS1 logistic label sample`}
    class="block w-full border border-gray-900 bg-white"
    style={`aspect-ratio: ${aspectRatio};`}
    data-print-layout={printLayout}
    data-label-size={labelSize}
  ></iframe>
  <figcaption class="mt-2 text-center text-xs text-muted-foreground">
    Static sample rendered with the app's production PDF label layout.
  </figcaption>
</figure>
