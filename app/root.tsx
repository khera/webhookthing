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
import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { createSupabaseServerClient, type Database } from '~/lib/supabase.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
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
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, serverAccessToken, revalidate]);

  return <Outlet context={{ supabase, serverSession }} />;
}
