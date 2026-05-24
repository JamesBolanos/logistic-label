<!-- src/routes/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

    let isLoggedIn = $derived(Boolean(page.data.user));
    
    // Features list
    const features = [
      {
        title: 'GS1-128 Compliant',
        description: 'Generate logistic labels that follow the GS1 standard for barcodes and data representation.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`
      },
      {
        title: '4x6 Label Format',
        description: 'Standard logistics label size with properly structured information sections.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>`
      },
      {
        title: 'PDF Generation',
        description: 'High-quality PDF output ready for printing on label printers.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>`
      },
      {
        title: 'Label History',
        description: 'Keep track of all your generated labels with search and filtering options.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>`
      },
      {
        title: 'Secure Access',
        description: 'Your label data is protected with secure authentication and authorization.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>`
      },
      {
        title: 'Database Storage',
        description: 'All generated labels are stored for future reference and reuse.',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>`
      }
    ];
  </script>
  
  <svelte:head>
    <title>GS1-128 Logistic Label Generator</title>
    <meta name="description" content="Generate GS1-128 compliant logistic labels for your shipping and inventory needs." />
  </svelte:head>
  
  <div class="pb-16">
    <!-- Hero Section -->
    <div class="bg-blue-600 rounded-lg shadow-lg overflow-hidden">
      <div class="max-w-4xl mx-auto px-6 py-16 text-center text-white">
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
          GS1-128 Logistic Label Generator
        </h1>
        <p class="mt-6 text-xl max-w-2xl mx-auto">
          Create standardized 4x6 inch logistics labels with GS1-128 barcodes to streamline your shipping operations.
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
                Get Started
              </a>
              <a
                href="/login"
                class="flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:text-lg"
              >
                Sign In
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Features Section -->
    <div class="mt-16">
      <h2 class="text-3xl font-extrabold text-gray-900 text-center mb-12">
        Features
      </h2>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {#each features as feature}
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div class="flex items-center justify-center w-12 h-12 rounded-md bg-blue-500 text-white mb-4">
              {@html feature.icon}
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
        About GS1-128 Logistic Labels
      </h2>
      <div class="prose max-w-none">
        <p>
          GS1-128 (formerly UCC/EAN-128) is a barcode standard used worldwide for shipping containers and logistic units. 
          It encodes data using Application Identifiers (AIs) that allow various types of information to be represented 
          in a standardized format.
        </p>
        <p class="mt-4">
          Our label generator creates 4x6 inch labels that follow the GS1 standard structure with three sections:
        </p>
        <ul class="mt-2">
          <li>Top section: Company information</li>
          <li>Middle section: Human-readable text with Application Identifiers</li>
          <li>Bottom section: GS1-128 barcodes for automated scanning</li>
        </ul>
        <p class="mt-4">
          These labels include important information like:
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
        Ready to create your logistic labels?
      </h2>
      <p class="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
        Sign up now to get started with our GS1-128 label generator. It's quick, easy, and helps ensure your 
        shipping processes comply with global standards.
      </p>
      <div class="mt-8">
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
            Create Account
          </a>
        {/if}
      </div>
    </div>
  </div>
