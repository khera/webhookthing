// function to instantiate our server side supabase client.

import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js';

import { Database } from './generated/database.types';

// make it easy to get the record types for a table. refer to the type as Tables<'TableName'>
export type { Database, Tables } from './generated/database.types';

export function createSupabaseServerClient(request: Request) {
  const headers = new Headers()

  const supabaseServerClient = createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
          )
        },
      },
    },
  );

  return { supabaseServerClient, headers }
}

export function createSupabaseAdminClient() {
    return { supabaseAdminClient: createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) }
}
