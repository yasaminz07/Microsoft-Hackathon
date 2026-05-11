import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// Proxy defers createClient() until first property access (i.e., at runtime in the browser,
// not during Next.js static prerendering when env vars may be absent).
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(client) : val;
  },
});
