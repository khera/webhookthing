// function to instantiate our server side supabase client.

import { createServerClient, parse, serialize } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { Database } from './generated/database.types';

// make it easy to get the record types for a table. refer to the type as Tables<'TableName'>
export type { Tables } from './generated/database.types';

export function createSupabaseServerClient(request: Request) {
  const cookies = parse(request.headers.get('Cookie') ?? '')
  const headers = new Headers()

  const supabaseClient = createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key]
        },
        set(key, value, options) {
          headers.append('Set-Cookie', serialize(key, value, options))
        },
        remove(key, options) {
          headers.append('Set-Cookie', serialize(key, '', options))
        },
      },
    },
  );

  return { supabaseClient, headers }
}

export function createSupabaseAdminClient() {
    return { supabaseClient: createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) }
}
