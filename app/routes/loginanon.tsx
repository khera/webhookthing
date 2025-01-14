import { data, redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';

import { createSupabaseServerClient } from '~/lib/supabase.server';
import { logger } from '~/lib/logger';

import SignIn from './login';

export function loader () {
    // if someone GETs this URL just send them to home page
    throw redirect('/');
}

export async function action ({ request }: ActionFunctionArgs) {
    const { supabaseServerClient, headers } = createSupabaseServerClient(request);
    const allowAnonymous = process.env.PERMIT_ANONYMOUS_USERS === 'true' ? true : false;
    if (!allowAnonymous) {
        return data({ error: "Anonymous signin is disabled in app configuration." }, { headers });
    }

    const { data: {session}, error } = await supabaseServerClient.auth.signInAnonymously();

    if (error) {
        logger.debug(`login error ${error.message}, status=${error.status}`);
        if (error.status === 422) {
            // Anonymous sign-ins are disabled, status=422
            logger.error("Configuration Error: Supabase refusing anonymous signin but feature is enabled in app.");
        }
        return data({ error: error.message }, { headers })
    }

    if (session) {
        await supabaseServerClient.auth.signOut()
    }

    logger.debug(`logged in anonymous user ${session?.user.id}`);

    throw redirect('/', { headers });    // send back to home page with cookies set
}

export default SignIn;