<script>
  let { data } = $props();

  let statistics = $derived(data.statistics);
  let cards = $derived([
    {
      label: 'New users',
      value: statistics.summary.newUsers,
      note: `Signed up in ${statistics.days} days`
    },
    {
      label: 'First-label users',
      value: statistics.summary.firstLabelUsers,
      note: `Reached a first saved label in ${statistics.days} days`
    },
    {
      label: 'Weekly creators',
      value: statistics.summary.weeklyCreators,
      note: 'Saved a label in the last 7 days'
    },
    {
      label: 'Failed attempts',
      value: statistics.summary.failedAttempts,
      note: `${statistics.summary.affectedUsers} affected users`
    },
    {
      label: 'Custom inquiries',
      value: statistics.summary.customInquiries,
      note: 'Inquiry submissions are not tracked yet'
    },
    {
      label: 'Accepted projects',
      value: statistics.summary.acceptedProjects,
      note: 'Sales outcomes are not tracked yet'
    }
  ]);

  function displayValue(value) {
    return value === null ? 'Unavailable' : new Intl.NumberFormat('en').format(value);
  }

  function formatDate(value) {
    if (!value) return 'No external event data yet';

    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeZone: statistics.window.timeZone
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>Usage Statistics - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Private aggregate usage statistics for the SSCC label application."
  />
</svelte:head>

<div class="space-y-8">
  <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p class="text-sm font-semibold uppercase tracking-wide text-blue-600">Owner dashboard</p>
      <h1 class="mt-1 text-3xl font-bold text-gray-900">Usage statistics</h1>
      <p class="mt-2 max-w-3xl text-sm text-gray-600">
        Aggregate product signals for deciding where onboarding, reliability, and feature work need
        attention. No emails, company names, or label contents are shown.
      </p>
    </div>

    <nav aria-label="Reporting window" class="inline-flex w-fit rounded-md shadow-sm">
      <a
        href="?days=7"
        aria-current={statistics.days === 7 ? 'page' : undefined}
        class="rounded-l-md border px-4 py-2 text-sm font-medium {statistics.days === 7
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
      >
        7 days
      </a>
      <a
        href="?days=30"
        aria-current={statistics.days === 30 ? 'page' : undefined}
        class="-ml-px rounded-r-md border px-4 py-2 text-sm font-medium {statistics.days === 30
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
      >
        30 days
      </a>
    </nav>
  </header>

  <section
    aria-label="Reporting context"
    class="rounded-lg border {statistics.configuration.excludedUserCount > 0
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-amber-200 bg-amber-50 text-amber-800'} px-4 py-3 text-sm"
  >
    {#if statistics.configuration.excludedUserCount > 0}
      {statistics.configuration.excludedUserCount} configured owner/test
      {statistics.configuration.excludedUserCount === 1 ? 'account is' : 'accounts are'} excluded.
    {:else}
      Owner/test account IDs are not configured yet. Treat the totals as provisional until
      exclusions are set.
    {/if}
    {#if statistics.dataCoverageStart}
      Operational-event coverage begins {formatDate(statistics.dataCoverageStart)}.
    {:else}
      No external operational-event data is available yet.
    {/if}
  </section>

  <section aria-labelledby="summary-heading">
    <div class="mb-4">
      <h2 id="summary-heading" class="text-xl font-semibold text-gray-900">Summary</h2>
      <p class="mt-1 text-sm text-gray-500">
        Rolling {statistics.days}-day window ending now; weekly creators always use seven days.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {#each cards as card (card.label)}
        <article class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-medium text-gray-500">{card.label}</p>
          <p
            class="mt-2 {card.value === null
              ? 'text-xl text-gray-500'
              : 'text-3xl font-semibold text-gray-900'}"
          >
            {displayValue(card.value)}
          </p>
          <p class="mt-2 text-xs leading-5 text-gray-500">{card.note}</p>
        </article>
      {/each}
    </div>
  </section>

  <section
    aria-labelledby="funnel-heading"
    class="rounded-lg border border-gray-200 bg-white shadow-sm"
  >
    <div class="border-b border-gray-200 px-5 py-4">
      <h2 id="funnel-heading" class="text-xl font-semibold text-gray-900">First-label funnel</h2>
      <p class="mt-1 text-sm text-gray-500">
        Users who signed up in this window and had at least 24 hours to complete the workflow.
      </p>
    </div>

    <div class="space-y-5 p-5">
      {#each statistics.funnel as step (step.label)}
        <div>
          <div class="mb-2 flex items-center justify-between gap-4 text-sm">
            <span class="font-medium text-gray-700">{step.label}</span>
            <span class="text-gray-500">
              {step.value}{step.percentage === null ? '' : ` · ${step.percentage}%`}
            </span>
          </div>
          <div class="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full bg-blue-600"
              style={`width: ${step.percentage ?? 0}%`}
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    aria-labelledby="failures-heading"
    class="rounded-lg border border-gray-200 bg-white shadow-sm"
  >
    <div class="border-b border-gray-200 px-5 py-4">
      <h2 id="failures-heading" class="text-xl font-semibold text-gray-900">Workflow failures</h2>
      <p class="mt-1 text-sm text-gray-500">
        Controlled categories only; raw errors and user-entered values are excluded.
      </p>
    </div>

    {#if statistics.failures.length === 0}
      <p class="px-5 py-8 text-center text-sm text-gray-500">
        No external workflow failures were recorded in this window.
      </p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-5 py-3 text-left font-medium text-gray-600">Category</th>
              <th scope="col" class="px-5 py-3 text-right font-medium text-gray-600">Attempts</th>
              <th scope="col" class="px-5 py-3 text-right font-medium text-gray-600">
                Affected users
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#each statistics.failures as failure (failure.category)}
              <tr>
                <td class="px-5 py-3 font-medium capitalize text-gray-800">
                  {failure.category.replaceAll('_', ' ')}
                </td>
                <td class="px-5 py-3 text-right text-gray-600">{failure.attempts}</td>
                <td class="px-5 py-3 text-right text-gray-600">{failure.affectedUsers}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <p class="text-xs leading-5 text-gray-500">
    A saved label, PDF response, browser download, and physical print remain separate milestones.
    Inquiry and accepted-project cards stay unavailable until those outcomes have an authoritative
    recording source.
  </p>
</div>
