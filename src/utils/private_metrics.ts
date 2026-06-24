type MetricMeta = Record<string, string | number | boolean | null>;

interface TrackMetricInput {
  event: string;
  path?: string;
  course?: string;
  mode?: string;
  score?: number;
  userType?: string;
  meta?: MetricMeta;
}

export function trackPrivateMetric(input: TrackMetricInput) {
  if (typeof window === 'undefined') return;

  const payload = {
    event: input.event,
    path: input.path ?? window.location.pathname,
    course: input.course,
    mode: input.mode,
    score: input.score,
    userType: input.userType,
    meta: input.meta,
  };

  // BUG-FIX: When METRICS_ADMIN_KEY is configured on the server, POST requires
  // x-metrics-key. Use NEXT_PUBLIC_METRICS_WRITE_KEY (a separate write-only key)
  // so the client can authenticate without exposing the admin read key.
  // If no write key is configured (dev / demo mode), the header is omitted and
  // the endpoint falls through to its unauthenticated dev path.
  const writeKey = process.env.NEXT_PUBLIC_METRICS_WRITE_KEY;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (writeKey) {
    headers['x-metrics-key'] = writeKey;
  }

  try {
    fetch('/api/private-metrics', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silent by design: metrics must never block UX.
    });
  } catch {
    // Silent by design.
  }
}
