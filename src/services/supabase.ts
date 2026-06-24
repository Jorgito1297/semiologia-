import { createClient, SupabaseClient } from '@supabase/supabase-js';

// BUG-01 FIX: Lazy initialization — evita crash en build time / SSR cuando las
// env vars no están disponibles aún. El cliente se crea la primera vez que se
// necesita en runtime, no en import time.

export type { SupabaseClient };

let _client: SupabaseClient | null = null;

function buildClient(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!_client) {
    _client = createClient(url, anonKey);
  }
  return _client;
}

/**
 * Devuelve el cliente de Supabase (lazy, singleton).
 * Lanza Error solo si las env vars no están configuradas.
 * Úsalo cuando la operación requiere Supabase obligatoriamente.
 */
export function getSupabaseClient(): SupabaseClient {
  const client = buildClient();
  if (!client) {
    throw new Error(
      'Missing Supabase configuration. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Proxy mock requires dynamic typing by design
const createMockProxy = (path = ''): any => {
  const noop = () => {};
  const mockTarget = () => {};
  
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (value: { data: unknown; error: null }) => void) => {
          if (path.includes('auth.getSession')) {
            resolve({ data: { session: null }, error: null });
          } else if (path.includes('auth.getUser')) {
            resolve({ data: { user: null }, error: null });
          } else {
            resolve({ data: null, error: null });
          }
        };
      }
      
      if (prop === 'subscribe' || prop === 'onAuthStateChange') {
        return (callback: (event: string, session: null) => void) => {
          if (typeof callback === 'function') {
            callback('SIGNED_OUT', null);
          }
          return { data: { subscription: { unsubscribe: noop } } };
        };
      }

      if (typeof prop === 'symbol' || prop === 'inspect' || prop === 'toString' || prop === 'valueOf') {
        return noop;
      }

      return createMockProxy(path ? `${path}.${String(prop)}` : String(prop));
    },
    
    apply() {
      return createMockProxy(path);
    }
  };

  return new Proxy(mockTarget, handler);
};

const realClient = buildClient();
const mockClient = createMockProxy();

/**
 * Cliente con compatibilidad hacia atrás.
 * Es un Proxy seguro que evita crasheos cuando las variables de entorno
 * no están disponibles (modo demo/offline).
 */
export const supabaseClient: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (realClient) {
      const value = (realClient as unknown as Record<PropertyKey, unknown>)[prop as string];
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(realClient);
      }
      return value;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mockClient as any)[prop];
  }
});

/**
 * Util para narrowing de tipo en async closures.
 * Uso: const db = assertSupabase(supabaseClient);
 */
export function assertSupabase(
  client: SupabaseClient | null
): asserts client is SupabaseClient {
  if (!client) {
    throw new Error(
      'Supabase client is not available. Check your environment configuration.'
    );
  }
}

export const getSupabaseRawConfig = () => {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    '';
  return { url, anonKey };
};
