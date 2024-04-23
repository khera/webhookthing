import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { createSupabaseServerClient, type Database } from '~/lib/supabase.server';
import type { OutletContext } from "~/lib/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    ALLOW_ANON: process.env.PERMIT_ANONYMOUS_USERS === 'true' ? true : false,
  };

  const { supabaseServerClient, headers } = createSupabaseServerClient(request);

  const { data: { session: serverSession } } = await supabaseServerClient.auth.getSession();

  return json({ env, serverSession, headers });
}


export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // set up a Supabase browser client and stash it in the OutletContext for other pages to access it
  const { env, serverSession } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();

  const [supabase] = useState(() => createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY));

  const serverAccessToken = serverSession?.access_token;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== serverAccessToken) {
        revalidate();
      }

      if (event === 'INITIAL_SESSION' && serverSession) {
        // the session in the `supabase` client doesn't get updated by server-side login
        // on the initial login, so we need to manually set it here.
        //console.debug(`setting session ${serverSession?.access_token}`);
        supabase.auth.setSession(serverSession as Session); // it comes as JsonifyObject<Session>
      } 

    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, serverAccessToken, revalidate, serverSession]);

  return <Outlet context={{ supabase, serverSession, allowAnonymous: env.ALLOW_ANON } as OutletContext} />;
}
