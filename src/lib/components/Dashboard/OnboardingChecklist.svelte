<script>
  import { m } from '#lib/paraglide/messages.js';

  let { progress } = $props();

  const definitions = [
    {
      id: 'accountCreated',
      title: m.onboarding_account_created(),
      description: m.onboarding_account_created_desc()
    },
    {
      id: 'settingsConfigured',
      title: m.onboarding_configure_settings(),
      description: m.onboarding_configure_settings_desc()
    },
    {
      id: 'previewCompleted',
      title: m.onboarding_review_preview(),
      description: m.onboarding_review_preview_desc()
    },
    {
      id: 'firstLabelSaved',
      title: m.onboarding_save_first_label(),
      description: m.onboarding_save_first_label_desc()
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
  class="overflow-hidden rounded-lg border border-blue-200 dark:border-blue-900 bg-surface shadow"
  aria-labelledby="first-label-onboarding-heading"
>
  <div
    class="border-b border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 px-5 py-5 sm:flex sm:items-start sm:justify-between"
  >
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
        {m.onboarding_getting_started()}
      </p>
      <h2 id="first-label-onboarding-heading" class="mt-1 text-xl font-bold text-foreground">
        {m.onboarding_first_label()}
      </h2>
      <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
        {m.onboarding_first_label_desc()}
      </p>
    </div>
    <p class="mt-3 text-sm font-medium text-blue-800 dark:text-blue-300 sm:mt-1">
      {m.onboarding_progress({ completed: progress.completedCount, total: progress.totalSteps })}
    </p>
  </div>

  <div class="px-5 py-5">
    <div
      class="h-2 overflow-hidden rounded-full bg-surface-strong"
      role="progressbar"
      aria-label={m.onboarding_first_label_progress()}
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
            class={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step.completed ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-surface-strong text-muted-foreground'}`}
            aria-hidden="true"
          >
            {step.completed ? '✓' : index + 1}
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-foreground">{step.title}</h3>
              {#if !step.completed && index === progress.completedCount}
                <span
                  class="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300"
                >
                  {m.onboarding_next()}
                </span>
              {/if}
            </div>
            <p class="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        </li>
      {/each}
    </ol>

    <div class="mt-6">
      <a
        href={progress.nextAction.href}
        class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface"
      >
        {progress.nextAction.label}
        <span class="ml-2" aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
