<!-- Public marketing and informational pages. -->
<script>
  import Footer from '#lib/components/Layout/Footer.svelte';
  import PublicHeader from '#lib/components/Layout/PublicHeader.svelte';

  let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-background">
  <PublicHeader user={data.user} />

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
    {@render children()}
  </main>

  <Footer />
</div>
