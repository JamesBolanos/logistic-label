<svelte:head>
  <title>Print Bridge - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Learn how the optional Print Bridge utility connects SSCC Labels to a ZPL-compatible network printer on your local network."
  />
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8">
  <header
    class="overflow-hidden rounded-2xl bg-blue-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12"
  >
    <p class="text-sm font-semibold uppercase tracking-wider text-blue-100">
      Optional desktop utility
    </p>
    <h1 class="mt-3 text-3xl font-bold sm:text-4xl">
      Print labels directly to your network printer
    </h1>
    <p class="mt-4 max-w-3xl text-lg leading-7 text-blue-100">
      Print Bridge is a separate, open-source utility that runs on your computer and optionally
      connects SSCC Labels to a ZPL-compatible network printer. You can continue to download PDF and
      ZPL files without installing it.
    </p>
    <div class="mt-7 flex flex-col gap-3 sm:flex-row">
      <a
        href="https://github.com/JamesBolanos/print-bridge"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
      >
        View Print Bridge on GitHub
      </a>
      <a
        href="https://github.com/JamesBolanos/print-bridge/releases/latest"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-md border border-blue-200 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
      >
        View downloads
      </a>
    </div>
  </header>

  <section
    aria-labelledby="how-it-works-heading"
    class="rounded-xl border border-border-default bg-surface p-6 shadow-sm sm:p-8"
  >
    <h2 id="how-it-works-heading" class="text-2xl font-bold text-foreground">How it works</h2>
    <ol class="mt-6 grid gap-4 md:grid-cols-3">
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          1. Save a label
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Create and save a label in SSCC Labels. Printing uses that saved label and its existing
          SSCC.
        </p>
      </li>
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          2. Send it from your browser
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Choose <strong class="text-foreground">Print via bridge</strong>. The browser gets the
          label's ZPL and sends it to Print Bridge running on your computer.
        </p>
      </li>
      <li class="rounded-lg bg-surface-muted p-5">
        <p class="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          3. Print on your network
        </p>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          Print Bridge forwards the ZPL to the network printer you configured. The hosted web app
          does not connect to your local network.
        </p>
      </li>
    </ol>
  </section>

  <section
    aria-labelledby="what-you-need-heading"
    class="rounded-xl border border-border-default bg-surface p-6 shadow-sm sm:p-8"
  >
    <h2 id="what-you-need-heading" class="text-2xl font-bold text-foreground">What you need</h2>
    <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
      <li>Print Bridge installed and running on the same computer as your browser.</li>
      <li>A ZPL-compatible network printer reachable from that computer.</li>
      <li>
        Your printer address, port, and resolution configured in SSCC Labels under Settings → LAN
        printer.
      </li>
    </ul>
    <p class="mt-4 text-sm leading-6 text-muted-foreground">
      Setup instructions, supported downloads, and the source code are maintained in the
      <a
        href="https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      >
        Print Bridge setup guide
      </a>. A successful send means the bridge acknowledged the job; check the physical label to
      confirm the printer output.
    </p>
  </section>

  <nav aria-label="Related pages" class="flex flex-wrap gap-4 text-sm font-semibold">
    <a
      href="/guide"
      class="text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
    >
      Compare supported labels
    </a>
    <a
      href="/settings"
      class="text-blue-700 underline hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
    >
      Configure printer settings
    </a>
  </nav>
</div>
