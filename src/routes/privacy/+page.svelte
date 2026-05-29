<script>
  const policySections = [
    {
      title: 'What We Collect',
      items: [
        'User account information, including email, username, and authentication data',
        'Business data you submit, such as labels, documents, and label metadata',
        'Usage data, including logs, device details, and product interactions'
      ]
    },
    {
      title: 'How We Use Your Data',
      items: [
        'Provide, maintain, and improve the label generation service',
        'Authenticate users and protect account access',
        'Improve the application and user experience',
        'Meet legal, security, and compliance obligations'
      ]
    },
    {
      title: 'Data Storage and Security',
      items: [
        'Access to user and business data is restricted to authorized personnel',
        'Security measures are used to protect against unauthorized access or disclosure',
        'Data is stored in the EEA or jurisdictions with adequate data protection laws'
      ]
    },
    {
      title: 'Data Sharing',
      items: [
        'We do not sell or rent personal or business data',
        'Service providers may process data for hosting, maintenance, or compliance',
        'Data may be disclosed where required by law or to protect users and the service'
      ]
    },
    {
      title: 'Your Rights',
      items: [
        'Access, correct, or delete your personal data',
        'Restrict or object to certain processing activities',
        'Request data portability or withdraw consent at any time'
      ]
    },
    {
      title: 'Data Retention',
      items: [
        'Data is retained only as long as needed for the purposes outlined here',
        'Retention may be extended where required by law',
        'Data is securely deleted when it is no longer needed'
      ]
    }
  ];
</script>

<svelte:head>
  <title>Privacy Policy - GS1-128 Logistic Label Generator</title>
  <meta
    name="description"
    content="Privacy policy for the GS1-128 Logistic Label Generator."
  />
</svelte:head>

<div class="space-y-8">
  <header class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div class="px-6 py-8 sm:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          
          <h1 class="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How we protect your data
          </h1>
          <p class="mt-4 text-base leading-7 text-gray-600">
            This page outlines how the GS1-128 Logistic Label Generator collects,
            uses, and protects user and business data.
          </p>
          <p class="mt-3 text-sm text-gray-500">Last updated: May 28, 2026</p>
        </div>

        <div class="rounded-lg bg-blue-50 border border-blue-100 px-5 py-4 lg:w-72">
          <p class="text-sm font-medium text-blue-900">Privacy standard</p>
          <p class="mt-2 text-sm leading-6 text-blue-800">
            Account and label data are handled securely with attention to GDPR and
            other privacy requirements.
          </p>
        </div>
      </div>
    </div>
  </header>

  <section class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
    {#each policySections as section (section.title)}
      <article class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div class="px-6 py-5 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">{section.title}</h2>
        </div>
        <div class="px-6 py-5">
          <ul class="space-y-4">
            {#each section.items as item (item)}
              <li class="flex gap-3 text-sm leading-6 text-gray-600">
                <span class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                <span>{item}</span>
              </li>
            {/each}
          </ul>
        </div>
      </article>
    {/each}
  </section>

  <section class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 sm:px-8">
      <h2 class="text-lg font-medium text-gray-900">Contact</h2>
      <p class="mt-1 text-sm text-gray-500">
        <a class="font-medium text-blue-600 hover:text-blue-500" href="mailto:jbolanosdiaz@gmail.com">
          Contact privacy support
        </a>
        with privacy questions or requests related to your data.
      </p>
    </div>
  </section>
</div>
