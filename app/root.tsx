import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRevalidator,
  isRouteErrorResponse,
  useRouteError 
} from "@remix-run/react";
import { useEffect, useState, useContext } from "react";
import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';
import { data, type LoaderFunctionArgs } from "@remix-run/node";

import { createSupabaseServerClient, type Database } from '~/lib/supabase.server';
import type { OutletContext } from "~/lib/types";

import { withEmotionCache } from '@emotion/react';
import { ClientStyleContext } from "~/lib/ClientStyleContext";

import { theme } from '~/theme';
import { CssBaseline, ThemeProvider, unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/material';

export async function loader({ request }: LoaderFunctionArgs) {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    ALLOW_ANON: process.env.PERMIT_ANONYMOUS_USERS === 'true' ? true : false,
  };

  const { supabaseServerClient, headers } = createSupabaseServerClient(request);

  const { data: { session: serverSession } } = await supabaseServerClient.auth.getSession();

  return data({ env, serverSession, headers });
}

export const Layout = withEmotionCache(({ children }: { children: React.ReactNode }, emotionCache) => {
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEnhancedEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData.reset();
    }, []);

    return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <CssBaseline />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

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

// Just using the example from docs for now.
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </ThemeProvider>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
