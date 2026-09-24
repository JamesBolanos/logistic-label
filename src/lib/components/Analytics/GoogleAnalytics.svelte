<script>
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { initializeAnalytics, trackPageView } from '$lib/analytics/client.js';

  let { measurementId = null } = $props();

  afterNavigate(({ to }) => {
    if (!browser || !to?.url) return;
    initializeAnalytics(measurementId);
    trackPageView(to.url.pathname, document.title);
  });
</script>
