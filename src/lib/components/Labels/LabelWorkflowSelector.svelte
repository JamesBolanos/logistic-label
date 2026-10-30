<script>
  import { LABEL_SCENARIOS, LABEL_SCENARIO_STATUSES } from '#lib/labels/scenarios.js';

  let { onselect } = $props();

  function isAvailable(scenario) {
    return scenario.status === LABEL_SCENARIO_STATUSES.AVAILABLE;
  }

  function statusClass(status) {
    if (status === LABEL_SCENARIO_STATUSES.AVAILABLE)
      return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
    return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
  }
</script>

<section class="rounded-lg bg-surface p-6 shadow-md" aria-labelledby="workflow-heading">
  <div class="mb-6">
    <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
      Step 1 of 3
    </p>
    <h2 id="workflow-heading" class="mt-1 text-xl font-bold text-foreground">
      What do you need to ship?
    </h2>
    <p class="mt-2 max-w-3xl text-sm text-muted-foreground">
      Choose the real-world situation that best matches your shipment. The generator will apply the
      supported GS1 rules for you.
    </p>
  </div>

  <div class="grid gap-5 lg:grid-cols-2">
    {#each LABEL_SCENARIOS as scenario (scenario.id)}
      <!-- Planned cards stay visible so users can understand the roadmap without entering unsupported data. -->
      <button
        type="button"
        disabled={!isAvailable(scenario)}
        aria-label={`${scenario.title} — ${scenario.statusLabel}`}
        aria-describedby={`scenario-${scenario.id}-details`}
        onclick={() => isAvailable(scenario) && onselect?.(scenario.labelType)}
        class={`flex h-full flex-col rounded-xl border p-5 text-left transition ${
          isAvailable(scenario)
            ? 'border-blue-200 bg-surface hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-blue-900 dark:hover:bg-blue-950/40'
            : 'cursor-not-allowed border-border-default bg-surface-strong opacity-70'
        }`}
      >
        <p class="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {scenario.category}
        </p>
        <div class="flex items-start justify-between gap-4">
          <h3 class="mt-2 text-lg font-semibold text-foreground">{scenario.title}</h3>
          <span
            class={`mt-2 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(scenario.status)}`}
          >
            {scenario.statusLabel}
          </span>
        </div>

        <div id={`scenario-${scenario.id}-details`} class="mt-4 flex flex-1 flex-col gap-4">
          <p class="text-sm leading-6 text-muted-foreground">{scenario.description}</p>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
              Best for
            </p>
            <p class="mt-1 text-sm text-muted-foreground">{scenario.targetUser}</p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
              Label output
            </p>
            <ul class="mt-1 space-y-1 text-sm text-muted-foreground">
              {#each scenario.outputs as output (output)}
                <li class="flex gap-2">
                  <span aria-hidden="true" class="text-blue-500 dark:text-blue-400">•</span>
                  <span>{output}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>

        {#if isAvailable(scenario)}
          <span class="mt-5 text-sm font-semibold text-blue-700 dark:text-blue-300"
            >{scenario.actionLabel} →</span
          >
        {/if}
      </button>
    {/each}
  </div>

  <div
    class="mt-6 rounded-md border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4 text-sm text-blue-900 dark:text-blue-200"
  >
    Unsure which situation applies? Choose <strong>Track a pallet, carton, or parcel</strong> when you
    only need a unique shipping-unit identifier and keep the contents in another business record.
  </div>
</section>
