import { NextResponse } from 'next/server';

// BUG-03 FIX: El POST ahora requiere autenticación mediante `x-metrics-key`.
// BUG-04 FIX: En entornos serverless (Firebase App Hosting, Vercel), el
//   filesystem es efímero. Las métricas ahora se envían a Supabase como
//   fallback primario, y el filesystem solo se usa en desarrollo local.

interface MetricEvent {
  ts: string;
  event: string;
  path: string;
  course?: string;
  mode?: string;
  score?: number;
  userType?: string;
  meta?: Record<string, string | number | boolean | null>;
}

// Detectar si estamos en entorno serverless (sin filesystem persistente)
const IS_SERVERLESS =
  process.env.VERCEL === '1' ||
  process.env.FIREBASE_CONFIG !== undefined ||
  process.env.K_SERVICE !== undefined; // Cloud Run / Firebase App Hosting

function normalizeEvent(payload: unknown): MetricEvent | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Partial<MetricEvent>;
  if (!raw.event || typeof raw.event !== 'string') return null;

  return {
    ts: new Date().toISOString(),
    event: raw.event.slice(0, 120),
    path: typeof raw.path === 'string' ? raw.path.slice(0, 200) : '/',
    course: typeof raw.course === 'string' ? raw.course.slice(0, 80) : undefined,
    mode: typeof raw.mode === 'string' ? raw.mode.slice(0, 80) : undefined,
    score: typeof raw.score === 'number' ? raw.score : undefined,
    userType:
      typeof raw.userType === 'string' ? raw.userType.slice(0, 80) : undefined,
    meta:
      raw.meta && typeof raw.meta === 'object'
        ? Object.fromEntries(
            Object.entries(raw.meta)
              .slice(0, 20)
              .map(([k, v]) => [
                k.slice(0, 80),
                v as string | number | boolean | null,
              ])
          )
        : undefined,
  };
}

function getProvidedKey(request: Request): string {
  const headerKey = request.headers.get('x-metrics-key');
  if (headerKey) return headerKey;
  const url = new URL(request.url);
  return url.searchParams.get('key') ?? '';
}

async function persistToSupabase(event: MetricEvent): Promise<boolean> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/metric_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(event),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function persistToFilesystem(event: MetricEvent): Promise<boolean> {
  if (IS_SERVERLESS) return false;
  try {
    // Dynamic import to avoid breaking in edge runtime
    const { promises: fs } = await import('node:fs');
    const path = await import('node:path');
    const metricsFile = path.join(
      process.cwd(),
      'artifacts',
      'metrics',
      'private_events.jsonl'
    );
    await fs.mkdir(path.dirname(metricsFile), { recursive: true });
    await fs.appendFile(metricsFile, `${JSON.stringify(event)}\n`, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// BUG-03 FIX: POST ahora requiere x-metrics-key para evitar abuso / DoS
// BUG-FIX: Accept METRICS_WRITE_KEY as an alternative to METRICS_ADMIN_KEY for POST.
// This decouples write access (frontend events) from read access (admin dashboard).
// METRICS_WRITE_KEY = write-only key for client. METRICS_ADMIN_KEY = full read/write for admin.
export async function POST(request: Request) {
  const adminKey = process.env.METRICS_ADMIN_KEY;
  const writeKey = process.env.METRICS_WRITE_KEY;

  // Si alguna key está configurada, exigirla. Si ninguna está configurada (dev local), permitir sin key.
  if (adminKey || writeKey) {
    const providedKey = getProvidedKey(request);
    const isAdminKey = adminKey && providedKey === adminKey;
    const isWriteKey = writeKey && providedKey === writeKey;
    if (!isAdminKey && !isWriteKey) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }
  }

  try {
    const body = await request.json();
    const normalized = normalizeEvent(body);
    if (!normalized) {
      return NextResponse.json(
        { ok: false, error: 'Invalid event payload.' },
        { status: 400 }
      );
    }

    // BUG-04 FIX: Intentar Supabase primero (persistente en serverless),
    // con filesystem como fallback solo en entornos locales.
    const savedToSupabase = await persistToSupabase(normalized);
    if (!savedToSupabase) {
      await persistToFilesystem(normalized);
    }

    return NextResponse.json({
      ok: true,
      storage: savedToSupabase ? 'supabase' : IS_SERVERLESS ? 'dropped' : 'filesystem',
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Failed to persist metric event.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const adminKey = process.env.METRICS_ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { ok: false, error: 'METRICS_ADMIN_KEY is not configured.' },
      { status: 500 }
    );
  }

  const providedKey = getProvidedKey(request);
  if (providedKey !== adminKey) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  // En serverless leer desde Supabase; localmente desde filesystem
  if (IS_SERVERLESS) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: 'Supabase not configured for metrics.' },
        { status: 500 }
      );
    }

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/metric_events?select=*&order=ts.desc&limit=200`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      const events: MetricEvent[] = await res.json();

      const byEvent: Record<string, number> = {};
      const byCourse: Record<string, number> = {};
      const byPath: Record<string, number> = {};

      for (const event of events) {
        byEvent[event.event] = (byEvent[event.event] ?? 0) + 1;
        if (event.course) byCourse[event.course] = (byCourse[event.course] ?? 0) + 1;
        byPath[event.path] = (byPath[event.path] ?? 0) + 1;
      }

      return NextResponse.json({
        ok: true,
        storage: 'supabase',
        totalEvents: events.length,
        lastEventAt: events[0]?.ts ?? null,
        byEvent,
        byCourse,
        byPath,
        recent: events.slice(0, 50),
      });
    } catch {
      return NextResponse.json({ ok: false, error: 'Failed to load metrics from Supabase.' }, { status: 500 });
    }
  }

  // Filesystem (desarrollo local)
  try {
    const { promises: fs } = await import('node:fs');
    const path = await import('node:path');
    const metricsFile = path.join(
      process.cwd(),
      'artifacts',
      'metrics',
      'private_events.jsonl'
    );
    await fs.mkdir(path.dirname(metricsFile), { recursive: true });
    let content = '';
    try { content = await fs.readFile(metricsFile, 'utf-8'); } catch { /* empty */ }

    const events = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => { try { return JSON.parse(l) as MetricEvent; } catch { return null; } })
      .filter((e): e is MetricEvent => e !== null);

    const byEvent: Record<string, number> = {};
    const byCourse: Record<string, number> = {};
    const byPath: Record<string, number> = {};

    for (const event of events) {
      byEvent[event.event] = (byEvent[event.event] ?? 0) + 1;
      if (event.course) byCourse[event.course] = (byCourse[event.course] ?? 0) + 1;
      byPath[event.path] = (byPath[event.path] ?? 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      storage: 'filesystem',
      totalEvents: events.length,
      lastEventAt: events.at(-1)?.ts ?? null,
      byEvent,
      byCourse,
      byPath,
      recent: events.slice(-50),
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load metrics.' }, { status: 500 });
  }
}
