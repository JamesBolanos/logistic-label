<!-- src/routes/+layout.svelte -->
<script>
  import GoogleAnalytics from '$lib/components/Analytics/GoogleAnalytics.svelte';
  import Footer from '$lib/components/Layout/Footer.svelte';
  import Navbar from '$lib/components/Layout/Navbar.svelte';
  import '../app.css';

  let { data, children } = $props();
</script>

<GoogleAnalytics measurementId={data.analyticsMeasurementId} />

<div class="flex min-h-screen flex-col">
  <Navbar />

  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
    {@render children()}
  </main>

  <Footer />
</div>
