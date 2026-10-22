<!-- Authenticated application shell: fixed sidebar plus account header. -->
<script>
  import AppHeader from '#lib/components/Layout/AppHeader.svelte';
  import AppSidebar from '#lib/components/Layout/AppSidebar.svelte';

  let { data, children } = $props();
  let isSidebarOpen = $state(false);
</script>

<div class="min-h-screen bg-background">
  <AppSidebar
    user={data.user}
    isAnalyticsOwner={data.isAnalyticsOwner}
    mobileOpen={isSidebarOpen}
    onclose={() => (isSidebarOpen = false)}
  />

  <div class="lg:pl-72">
    <AppHeader user={data.user} ontogglemenu={() => (isSidebarOpen = !isSidebarOpen)} />

    <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {@render children()}
    </main>
  </div>
</div>
