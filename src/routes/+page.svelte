<!-- src/routes/+page.svelte -->
<script>
    import { page } from '$app/state';

    let isLoggedIn = $derived(Boolean(page.data.user));
    
    const features = [
      {
        title: 'Free GS1-128 label generation',
        description: 'Use the tool to create SSCC and GS1-128 logistic labels for common shipping and warehouse needs.',
        icon: 'check'
      },
      {
        title: '4x6 label format',
        description: 'Standard logistics label size with properly structured information sections. More formats will be added over time.',
        icon: 'layout'
      },
      {
        title: 'High-quality PDF output',
        description: 'Generate print-ready PDF labels designed for clear output and practical label printer workflows.',
        icon: 'file'
      },
      {
        title: 'Label history',
        description: 'Authenticated users can preview saved labels, recent activity, and account-specific label records.',
        icon: 'clipboard'
      },
      {
        title: 'Private access',
        description: 'Login keeps generated labels and label history separated by user account.',
        icon: 'lock'
      },
      {
        title: 'Tailored solutions',
        description: 'The same foundation can be adapted privately around your workflows, integrations, users, and deployment requirements.',
        icon: 'database'
      }
    ];
  </script>
  
  <svelte:head>
    <title>SSCC Labels - Free GS1-128 Logistic Label Generator</title>
    <meta name="description" content="Generate GS1-128 and SSCC logistic labels for free, or request a tailored private solution for your formats and printer models." />
  </svelte:head>
  
  <div class="pb-16">
    <!-- Hero Section -->
    <div class="bg-blue-600 rounded-lg shadow-lg overflow-hidden">
      <div class="max-w-4xl mx-auto px-6 py-16 text-center text-white">
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
          SSCC Labels
        </h1>
        <p class="mt-6 text-xl max-w-2xl mx-auto">
          Use this free tool to generate GS1-128 logistic labels for common SSCC workflows.
        </p>
        <p class="mt-4 text-base text-blue-100 max-w-2xl mx-auto">
          I will keep improving it and adding label formats, printer support, and workflow features. It also works as a preview for teams that need a tailored private solution.
        </p>
        <div class="mt-10">
          <div class="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
            {#if isLoggedIn}
              <a
                href="/labels"
                class="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 md:text-lg"
              >
                Generate Labels
              </a>
              <a
                href="/dashboard"
                class="flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:text-lg"
              >
                Dashboard
              </a>
            {:else}
              <a
                href="/signup"
                class="flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 md:text-lg"
              >
                Start Free
              </a>
              <a
                href="mailto:jbolanosdiaz@gmail.com?subject=Private%20SSCC%20Labels%20implementation"
                class="flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:text-lg"
              >
                Contact Me
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="mt-16">
      <h2 class="text-3xl font-extrabold text-gray-900 text-center mb-12">
        What You Can Use Today
      </h2>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each features as feature (feature.title)}
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div class="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
              {#if feature.icon === 'check'}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              {:else if feature.icon === 'layout'}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                </svg>
              {:else if feature.icon === 'file'}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              {:else if feature.icon === 'clipboard'}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              {:else if feature.icon === 'lock'}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              {/if}
            </div>
            <h3 class="text-lg font-bold mb-2">{feature.title}</h3>
            <p class="text-gray-600">{feature.description}</p>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- GS1 Info Section -->
    <div class="mt-16 bg-gray-50 p-8 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">
        Free Tool, Tailored Solution When You Need More
      </h2>
      <div class="prose max-w-none">
        <p>
          This website is meant to be useful on its own for generating GS1-128 logistic labels. It will continue to improve with additional label formats, printer models, and workflow features.
        </p>
        <p class="mt-4">
          This solution is guided by the
          <a
            href="https://www.gs1.org/docs/tl/GS1_Logistic_Label_Guideline.pdf"
            target="_blank"
            rel="noreferrer"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            GS1 Logistic Label Guideline
          </a>.
        </p>
        <p class="mt-4">
          For companies that need more than the public tool, a tailored private implementation can be configured for:
        </p>
        <ul class="mt-2">
          <li>Different label sizes and layouts</li>
          <li>Specific printer models and print formats</li>
          <li>Company, item, shipment, and customer data fields</li>
          <li>Warehouse workflows, user roles, and integrations</li>
        </ul>
        <p class="mt-4">
          The sample focuses on common GS1 logistic label data such as:
        </p>
        <ul class="mt-2">
          <li>GTIN (Global Trade Item Number)</li>
          <li>Lot/Batch numbers</li>
          <li>Production dates</li>
          <li>Quantity information</li>
          <li>Weight measurements</li>
          <li>SSCC (Serial Shipping Container Code)</li>
        </ul>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="mt-16 text-center">
      <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
        Generate Labels Now, Suggest Improvements, Or Request A Tailored Version
      </h2>
      <p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
        Create an account to use the free label generator. Contact me if you want to suggest improvements to the public tool or discuss a tailored version for your formats, printers, data, and workflow.
      </p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {#if isLoggedIn}
          <a
            href="/labels"
            class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg"
          >
            Generate Labels
          </a>
        {:else}
          <a
            href="/signup"
            class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg"
          >
            Start Free
          </a>
          <a
            href="mailto:jbolanosdiaz@gmail.com?subject=Private%20SSCC%20Labels%20implementation"
            class="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-800 bg-white hover:bg-gray-50 md:text-lg"
          >
            Contact Me
          </a>
        {/if}
      </div>
    </div>
  </div>
