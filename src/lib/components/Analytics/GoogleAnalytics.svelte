<script>
  import { afterNavigate } from '$app/navigation';
  import { browser } from '$app/env';
  import { initializeAnalytics, trackPageView } from '#lib/analytics/client.ts';

  let { measurementId = null } = $props();

  afterNavigate(({ to }) => {
    if (!browser || !to?.url) return;
    initializeAnalytics(measurementId);
    trackPageView(to.url.pathname, document.title);
  });
</script>
