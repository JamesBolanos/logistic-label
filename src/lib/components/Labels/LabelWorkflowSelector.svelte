<script>
  import { LABEL_TYPES } from '$lib/labels/workflows.js';

  let { onselect } = $props();

  const workflows = [
    {
      id: LABEL_TYPES.SSCC_ONLY,
      title: 'SSCC-only label',
      status: 'Available',
      description:
        'Identify one pallet, case, or other logistic unit. Product contents are not encoded.',
      available: true
    },
    {
      id: LABEL_TYPES.HOMOGENEOUS_UNIT,
      title: 'Homogeneous logistic unit',
      status: 'Available',
      description:
        'Identify a logistic unit containing multiple trade items that all share the same GTIN.',
      available: true
    },
    {
      id: 'trade_item_unit',
      title: 'Logistic unit that is a trade item',
      status: 'Coming later',
      description:
        'Use when the complete case or pallet is itself an orderable trade item with its own GTIN.',
      available: false
    },
    {
      id: 'mixed_pallet',
      title: 'Mixed-pallet content workflow',
      status: 'Coming later',
      description:
        'Use an SSCC-only label today. Detailed mixed contents normally travel in shipment data.',
      available: false
    }
  ];
</script>

<section class="rounded-lg bg-white p-6 shadow-md" aria-labelledby="workflow-heading">
  <div class="mb-6">
    <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Step 1 of 3</p>
    <h2 id="workflow-heading" class="mt-1 text-xl font-bold text-gray-900">
      What are you identifying?
    </h2>
    <p class="mt-2 max-w-3xl text-sm text-gray-600">
      Choose the scenario first so the form and barcode have one clear business meaning.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#each workflows as workflow (workflow.id)}
      <button
        type="button"
        disabled={!workflow.available}
        onclick={() => workflow.available && onselect?.(workflow.id)}
        class={`rounded-lg border p-5 text-left transition ${
          workflow.available
            ? 'border-blue-200 bg-white hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            : 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-70'
        }`}
      >
        <div class="flex items-start justify-between gap-4">
          <h3 class="font-semibold text-gray-900">{workflow.title}</h3>
          <span
            class={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              workflow.available ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {workflow.status}
          </span>
        </div>
        <p class="mt-3 text-sm text-gray-600">{workflow.description}</p>
      </button>
    {/each}
  </div>

  <div class="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
    Unsure which scenario applies? Start with an SSCC-only label when you only need to identify the
    physical logistic unit. The generated label will state exactly what is and is not encoded.
  </div>
</section>
