<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import GoogleAnalytics from '#lib/components/Analytics/GoogleAnalytics.svelte';
  import { initTheme } from '#lib/theme/theme.svelte.js';
  import '../app.css';

  let { data, children } = $props();

  // app.html applies the pre-paint theme class; this restores reactive state
  // and keeps following the system preference until the user chooses a theme.
  onMount(initTheme);
</script>

<GoogleAnalytics measurementId={data.analyticsMeasurementId} />

{@render children()}
