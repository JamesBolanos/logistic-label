<script>
  let { progress } = $props();

  const definitions = [
    {
      id: 'accountCreated',
      title: 'Account created',
      description: 'Your private label workspace is ready.'
    },
    {
      id: 'settingsConfigured',
      title: 'Configure label settings',
      description: 'Add your company name and GS1 Company Prefix for SSCC allocation.'
    },
    {
      id: 'previewCompleted',
      title: 'Review a label preview',
      description: 'Choose a shipping situation and review the PDF and automated checks.'
    },
    {
      id: 'firstLabelSaved',
      title: 'Save your first label',
      description: 'Reserve its SSCC and save the record to your label history.'
    }
  ];

  let steps = $derived(
    definitions.map((definition) => ({
      ...definition,
      completed: Boolean(progress.steps[definition.id])
    }))
  );
  let progressPercentage = $derived(
    Math.round((progress.completedCount / progress.totalSteps) * 100)
  );
</script>

<section
  class="overflow-hidden rounded-lg border border-blue-200 bg-white shadow"
  aria-labelledby="first-label-onboarding-heading"
>
  <div
    class="border-b border-blue-100 bg-blue-50 px-5 py-5 sm:flex sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-700">Getting started</p>
      <h2 id="first-label-onboarding-heading" class="mt-1 text-xl font-bold text-gray-950">
        Create your first logistic label
      </h2>
      <p class="mt-2 max-w-2xl text-sm text-gray-700">
        Complete these steps once. The generator will guide the label details for your shipping
        situation.
      </p>
    </div>
    <p class="mt-3 text-sm font-medium text-blue-800 sm:mt-1">
      {progress.completedCount} of {progress.totalSteps} complete
    </p>
  </div>

  <div class="px-5 py-5">
    <div
      class="h-2 overflow-hidden rounded-full bg-gray-200"
      role="progressbar"
      aria-label="First label setup progress"
      aria-valuemin="0"
      aria-valuemax={progress.totalSteps}
      aria-valuenow={progress.completedCount}
    >
      <div
        class="h-full rounded-full bg-blue-600 transition-all"
        style={`width: ${progressPercentage}%`}
      ></div>
    </div>

    <ol class="mt-5 grid gap-4 md:grid-cols-2">
      {#each steps as step, index (step.id)}
        <li class="flex gap-3">
          <span
            class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}
            aria-hidden="true"
          >
            {step.completed ? '✓' : index + 1}
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-gray-950">{step.title}</h3>
              {#if !step.completed && index === progress.completedCount}
                <span
                  class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  Next
                </span>
              {/if}
            </div>
            <p class="mt-1 text-sm text-gray-600">{step.description}</p>
          </div>
        </li>
      {/each}
    </ol>

    <div class="mt-6">
      <a
        href={progress.nextAction.href}
        class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {progress.nextAction.label}
        <span class="ml-2" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
